# Date & Time Handling Cleanup

> **Status: COMPLETED** — April 2026. All JS `Date` usage eliminated, branded
> string types enforced at API boundaries, pg type parsers handle DB conversions,
> legacy naming cleaned up. This document is retained as a historical decision
> record and guide for avoiding the same mistakes.

Tracking issue: https://github.com/thaapasa/bookkeeper/issues/91

---

## Rules (still in effect)

1. **API boundaries**: Plain date strings (`"2026-03-31"`, `"2025-12"`) for dates,
   ISO 8601 timestamps with timezone (`"2026-03-31T12:00:00+03:00"`) for timestamps.
   Never JS `Date` objects.
2. **Server**: Luxon `DateTime` internally. Dates are plain `ISODate` strings;
   timestamps arrive from DB as `ISOTimestamp` via custom pg type parsers.
3. **Client**: Luxon `DateTime` internally. No JS `Date` — Mantine date pickers
   accept ISO date strings directly. The only timezone-sensitive operation is
   resolving "today" via `DateTime.now()`.
4. **Shared types**: Branded string types only — `ISODate`, `ISOMonth`,
   `ISOTimestamp`. Never `Date` or `DateTime` in types that cross API boundaries.
5. **Database**: Custom pg type parsers in `Db.ts` convert at the boundary:
   - `DATE` → `ISODate` string (pass-through)
   - `TIMESTAMPTZ` → `ISOTimestamp` string (via `DateTime.fromSQL().toISO()`)
   - `TIMESTAMP` (without tz) → throws error (schema should use `TIMESTAMPTZ`)

---

## What went wrong (patterns to avoid)

### 1. Using `z.date()` or `Date` in shared types that cross the API

**Problem**: pg-promise returns `Date` objects, `JSON.stringify` turns them into
strings, but the TypeScript type still says `Date`. The client receives a string
while the type system claims it's a `Date`. Zod validation with `z.date()` would
reject the string on the client side.

**Examples found**: `Expense.created` used `z.date()`, `SessionBasicInfo.loginTime`
used `Date`.

**Rule**: Always use branded string types (`ISODate`, `ISOTimestamp`) for date/time
fields in shared types. Never `z.date()` or plain `Date`.

### 2. Unnecessary round-trips through JS Date

**Problem**: Converting `string → DateTime → Date → string` when the value starts
and ends as a string. Common pattern: a URL param is parsed to a Date, passed as a
prop, then immediately converted back to a string.

**Examples found**: `RoutedMonthView` converted URL param to `Date` via
`.toJSDate()`, `MonthView` immediately converted back via `toISODate(date)`.
`compareDates` went through `toDate().getTime()` when `toMillis()` was available.

**Rule**: Keep dates in their most useful form. If a value starts as a string and
consumers need a string, don't convert through `Date`. Use `ISODate` strings for
calendar dates, `DateTime` for computation.

### 3. Relying on pg-promise's default type conversions

**Problem**: pg-promise returns `DATE` and `TIMESTAMPTZ` columns as JS `Date`
objects. This forces `instanceof Date` checks and cast chains (`as unknown as
string`) throughout the codebase, and the runtime types don't match TypeScript types.

**Fix applied**: Custom pg type parsers registered at startup convert values at the
database boundary. `TIMESTAMP` without timezone throws to catch schema issues early.

**Rule**: Always register pg type parsers for date/time types. Never let pg-promise
return raw `Date` objects.

### 4. Overly permissive input types hiding intent

**Problem**: API functions accepted `DateLike` (which includes `DateTime` instants)
when they only dealt with calendar dates. This implied the API might behave
differently based on the time component, when in reality only the date part was used.

**Examples found**: `ApiConnect.getCategoryTotals` took `DateLike` parameters,
`countTotalBetween` had a local `DateTimeInput` shadow type.

**Rule**: Use `ISODate` for parameters that represent calendar dates. Reserve
`DateLike`/`DateTimeInput` for internal conversion utilities.

### 5. Unvalidated URL parameters cast to branded types

**Problem**: URL params were cast directly to branded types like `ISOMonth` without
validation. Navigating to `/m/garbage` would pass the string through unchecked.

**Rule**: Validate URL params against the type's regexp before casting. Fall back
to a sensible default (e.g., current month) on invalid input.

### 6. Legacy library names persisting after migration

**Problem**: Functions and types named after previous libraries (dayjs, Moment.js)
persisted long after the codebase migrated to Luxon. Names like `dayJsForDate`,
`MomentInterval`, `MomentRange` were confusing.

**Rule**: When migrating libraries, rename all related identifiers. A function
called `dayJsForDate` that returns a Luxon `DateTime` is actively misleading.

### 7. `new Date()` scattered through client code

**Problem**: Client code used `new Date()` in many places to get "now", creating
JS `Date` objects that were immediately passed to conversion functions. Inconsistent
with the Luxon-everywhere approach.

**Rule**: Use `DateTime.now()` or `toISODate()` for "now". The only acceptable use
of `new Date()` is `Date.now()` for millisecond timestamps in performance timing.
