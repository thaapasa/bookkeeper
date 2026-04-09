# Date & Time Handling Cleanup Plan

Tracking issue: https://github.com/thaapasa/bookkeeper/issues/91

## Goal

Ensure all date/time values follow these rules:

1. **API boundaries**: Use plain date strings (`"2026-03-31"`, `"2025-12"`) for dates, or
   ISO 8601 timestamps with timezone for timestamps (e.g. `"2026-03-31T12:00:00+03:00"`).
   Never pass JS `Date` objects across API boundaries.
2. **Server**: Use Luxon `DateTime` internally. No need to care about timezones (all
   business dates are plain `ISODate` strings). Timestamps from DB arrive as
   `timestamptz` and should be serialized as ISO 8601 strings.
3. **Client**: Use Luxon `DateTime` internally. JS `Date` should not be used — Mantine
   date pickers accept ISO date strings (`"2026-03-12"`) directly. Dates are
   timezone-agnostic; the only place timezone matters is when resolving "today"
   (via `DateTime.now()`), where the browser's local timezone is the correct choice.
4. **Shared types**: Types that cross API boundaries must use branded string types —
   `ISODate` for dates, `ISOMonth` for months, `ISOTimestamp` for timestamps with
   timezone. Never `Date` or `DateTime`.

---

## Findings

### F1. `Expense.created` uses `z.date()` (shared schema, crosses API)

**File:** `src/shared/expense/Expense.ts:83`

```typescript
created: z.date(),
```

The `Expense` schema is used for API responses. The DB column `expenses.created` is
`timestamp with time zone`. pg-promise returns this as a JS `Date`, which
`JSON.stringify` converts to an ISO 8601 string (e.g. `"2024-01-15T10:30:00.000Z"`).
On the client side, `z.date()` would reject this string during validation.

This likely works today only because the client doesn't validate the response with Zod,
but the type is still wrong: the TypeScript type says `Date` while the runtime value
after JSON deserialization is a `string`.

**Fix:** Change to `ISOTimestamp` (branded Zod type with validation, see Phase 1 step 1)
so the schema matches the JSON wire format. Both server DB-row mappers and client
consumers need to be updated to treat `created` as an `ISOTimestamp` string.

---

### F2. `SessionBasicInfo.loginTime` uses `Date` (shared type, crosses API)

**File:** `src/shared/types/Session.ts:50`

```typescript
loginTime?: Date;
```

The `sessions.login_time` column is `timestamp with time zone`. Same problem as F1: the
server returns a `Date` from pg-promise, which becomes an ISO string in JSON. The client
receives a string, not a `Date`.

**Fix:** Change to `loginTime?: ISOTimestamp`. Update `SessionDb.ts:69` and all consumers.

---

### F3. `UIDateRange` / `TypedDateRange` use JS `Date` (shared type, UI-only)

**File:** `src/shared/time/TimeRange.ts:26-33`

```typescript
export interface UIDateRange {
  start: Date;
  end: Date;
}
export interface TypedDateRange extends UIDateRange {
  type: 'year' | 'month' | 'custom';
}
```

These are used exclusively in the client for navigation state. They don't cross the API
boundary. However, they're defined in `shared/` which is misleading — shared types should
be safe to use on both sides. Since Mantine date pickers accept ISO strings directly,
there is no reason to use JS `Date` here at all.

**Fix:** Either:

- **Option A:** Convert `UIDateRange` / `TypedDateRange` to use `DateTime` (or `ISODate`
  strings) instead of `Date`. Remove all `.toJSDate()` calls in the functions that
  produce them (`yearRange`, `monthRange`, `toDateRange`).
- **Option B:** Move these types and their associated functions to `src/client/` and
  convert to `DateTime`. Keep only `DateRange` (ISODate strings) and `MomentRange`
  (`DateTime`) in shared.

---

### F4. `DateTimeInput` and `DateLike` include `Date` (shared utility types)

**File:** `src/shared/time/Time.ts:7,43`

```typescript
export type DateTimeInput = DateTime | Date | string | null | undefined;
export type DateLike = Date | DateTime | string;
```

These are input types for conversion functions (`toDateTime`, `toISODate`, etc.). They
accept `Date` so the functions work everywhere. This is a pragmatic choice — the
functions convert **from** Date, they don't produce or require it.

**Fix:** After F3 eliminates all JS `Date` usage, remove `Date` from both types.
`DateTimeInput` becomes `DateTime | string | null | undefined`, `DateLike` becomes
`DateTime | string`.

---

### F5. `toDate()` helper returns JS `Date` (shared utility)

**File:** `src/shared/time/Time.ts:78-83`

```typescript
export function toDate(d: DateLike): Date {
  if (d instanceof Date) return d;
  return toDateTime(d).toJSDate();
}
```

Used by `compareDates` and previously by client code for Mantine (no longer needed since
Mantine accepts ISO strings).

**Fix:** Remove `toDate()` entirely after F3/F4. Rewrite `compareDates` to use
`toDateTime().toMillis()` instead (see F12).

---

### F6. `MonthView` props use `date: Date`

**File:** `src/client/ui/expense/MonthView.tsx:17`

```typescript
interface MonthViewProps {
  date: Date;
}
```

The `RoutedMonthView` component converts a URL param (`"2024-03"`) to a JS `Date` via
`toDateTime(date + '-01').toJSDate()`, then passes it as a prop. `MonthView` immediately
converts it back via `toISODate(date)`.

**Fix:** Change the prop to `date: ISOMonth` (or `DateTime`). Remove the round-trip
through JS Date. Update `RoutedMonthView` to pass the month string directly.

---

### F7. `ShortcutsDropdown.openNewExpenseDialog` takes `shownDay: Date`

**File:** `src/client/ui/shortcuts/ShortcutsDropdown.tsx:85`

```typescript
function openNewExpenseDialog(navigate: NavigateFunction, shownDay: Date) {
```

Receives a JS Date and immediately converts to DateTime. Downstream of F6.

**Fix:** Change parameter to `DateTime` or `ISODate`. Will follow naturally from F6.

---

### F8. `new Date()` used for "current date" initialization in client

**Files:**

- `src/client/data/State.ts:77` — `monthRange(new Date())`
- `src/client/ui/expense/RoutedMonthView.tsx:13` — `new Date()` fallback
- `src/client/ui/category/RoutedCategoryView.tsx:22` — `yearRange(new Date())`
- `src/client/ui/search/SearchPage.tsx:68` — `toDateRange(... ?? new Date(), ...)`

These use `new Date()` to get "now" and immediately pass it to functions that accept
`DateLike`. The functions convert to `DateTime` internally.

**Fix:** Use `DateTime.now()` instead. Minor but consistent — avoids creating JS `Date`
objects unnecessarily when `DateLike` already accepts `DateTime`.

---

### F9. `new Date().getTime()` in server performance timing

**File:** `src/server/logging/TraceIdProvider.ts:37,79`

```typescript
startTime: new Date().getTime(),
const timeFromStart = new Date().getTime() - state.startTime;
```

Used for request elapsed-time measurement, not business dates.

**Fix:** Use `Date.now()` instead (same result, avoids allocating a Date object). This is
a minor cleanup, not a correctness issue.

---

### F10. `ApiStatus.timestamp` is untyped `string`

**File:** `src/shared/types/Api.ts:7`

```typescript
timestamp: string;
```

The server produces this via `toDateTime().toISO()` which returns a full ISO 8601 string
with timezone offset. The type is correct (string), but could be more precise.

**Fix:** Change `timestamp: string` → `timestamp: ISOTimestamp`. The `ISOTimestamp` type
created in Phase 1 is the exact right fit here.

---

### F11. `dateRangeUtils.ts` produces JS Dates via `.toJSDate()`

**File:** `src/client/ui/component/daterange/dateRangeUtils.ts:17-36`

All three functions (`toMonthRange`, `parseMonthRange`, `toYearRange`) create
`TypedDateRange` objects with `.toJSDate()` calls.

**Fix:** Follows from F3. If `TypedDateRange` is changed to use `DateTime`, these
functions simplify.

---

### F12. `ApiConnect.getCategoryTotals` takes `Date` parameters

**File:** `src/client/data/ApiConnect.ts:274`

```typescript
public getCategoryTotals = (startDate: Date, endDate: Date): Promise<CategoryAndTotals[]> =>
```

Called from `CategoryView.tsx:54` passing `range.start` and `range.end` from a
`TypedDateRange`. The dates are immediately converted to `ISODate` via `toISODate()`.

**Fix:** Change parameters to `DateLike` or `DateTime`. Follows naturally from F3 once
`TypedDateRange` no longer uses `Date`.

---

### F13. `compareDates` converts through JS Date unnecessarily

**File:** `src/shared/time/Time.ts:110-126`

```typescript
const a = toDate(first).getTime();
const b = toDate(second).getTime();
```

Converts to JS Date just to call `.getTime()` for numeric comparison. Luxon DateTimes
support direct comparison via `.toMillis()` or `<`/`>` operators.

**Fix:** Use `toDateTime(first).toMillis()` instead, avoiding the intermediate Date.

---

## Fix Plan (ordered by priority)

### Phase 1: API boundary correctness (F1, F2, F10) — DONE

Completed: created `ISOTimestamp` branded Zod type with timezone-requiring regex
(`Z` or `±hh:mm`), `toISOTimestamp()` helper, and updated all three API-boundary types:
`Expense.created`, `SessionBasicInfo.loginTime`, `ApiStatus.timestamp`.

### Phase 2 + 3: Eliminate JS Date from types and client code — DONE

Completed: converted `UIDateRange`/`TypedDateRange` to use `ISODate` strings (plain
calendar dates, not `DateTime` instants), removed `Date` from `DateTimeInput`/`DateLike`
types, removed `toDate()`, rewrote `compareDates` to use `toMillis()`. Also fixed all
client consumers: `MonthView` prop → `ISOMonth`, `ShortcutsDropdown` param → `DateLike`,
`ApiConnect.getCategoryTotals` → `DateLike`, replaced `new Date()` with `DateTime.now()`,
simplified redundant `toISODate()` calls on already-`ISODate` values.

### Phase 4: Minor cleanups (F9) — DONE

Completed: replaced `new Date().getTime()` with `Date.now()` in TraceIdProvider.

### Phase 5: Replace remaining `DateTime` with `ISODate` in client types — DONE

Completed: changed all client-side types that represent calendar dates from `DateTime`
to `ISODate`. This includes `ExpenseInEditor.date`, the `needUpdateBus` event bus,
`onExpensesUpdated` callbacks, date picker dialog types (`DateSelectDialogData`,
`DialogState.selectDate`), and the `DateField` component props. Also simplified
`shortcutToExpenseInEditor` and removed unnecessary `toDateTime`/`toISODate` conversions
throughout the expense dialog, split, and copy flows.

---

## Follow-up items

### Hardening

1. ~~**`DateSelectDialogContents.tsx`**~~ — Mitigated. `toDateTime()` retains a runtime
   `instanceof Date` check so that if Mantine's DatePicker returns a JS `Date`, it is
   converted correctly via `DateTime.fromJSDate()`.

2. ~~**`SessionDb.ts`**~~ — DONE (Phase 6). The cast chain was removed; `loginTime`
   now arrives as `ISOTimestamp` from the pg type parser.

3. ~~**`RoutedMonthView.tsx`**~~ — DONE. URL param is now validated against
   `ISOMonthRegExp`; invalid input falls back to the current month. Also hardened
   `RoutedCategoryView.tsx` similarly (year/month params validated against regexps).

### Remaining cleanups

4. ~~`RecurringExpenseDb.ts`~~ — DONE. Changed `DateTime.now()` to `toISODate()`.

5. ~~`RoutedCategoryView.tsx`~~ — DONE. Changed `yearRange(DateTime.now())` to
   `yearRange(toISODate())`.

### Phase 6: Leverage pg type parsers to remove manual conversions — DONE

Custom pg type parsers in `Db.ts` now handle all type conversions at the database
boundary. TIMESTAMPTZ parser produces proper ISOTimestamp via `DateTime.fromSQL().toISO()`.

1. ~~**TIMESTAMPTZ parser → produce `ISOTimestamp`**~~ — DONE. Parser now converts
   pg format (`2026-03-31 12:00:00+02`) to ISO 8601 (`2026-03-31T12:00:00.000+02:00`).

2. ~~**Remove `toISOTimestamp(e.created)` from `dbRowToExpense()`**~~ — DONE. Removed
   manual conversion in `BasicExpenseDb.ts`; `created` arrives as ISOTimestamp from pg.
   Also cleaned up unused `DateTime` import and local `DateTimeInput` type alias.

3. ~~**Clean up `SessionDb.ts`**~~ — DONE. Changed `loginTime` parameter from `Date`
   to `ISOTimestamp`, removed the `as unknown as string` cast chain and the comment
   about pg-promise returning Date objects.

4. ~~**Remove `instanceof Date` check from `toDateTime()`**~~ — DONE. Removed the
   dead code branch and its explanatory comment from `Time.ts`.

5. **Renamed `dayJsForDate` → `dateTimeFromParts`** in `Time.ts` — the function was
   a leftover from the pre-Luxon dayjs era. Updated all call sites in `TimeRange.ts`,
   `Period.ts`, `dateRangeUtils.ts`, and `YearlyRecurringChart.tsx`.
