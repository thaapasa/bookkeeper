# Code Quality Findings

Issues identified during a codebase scan in April 2026. Organized by priority.

## `any` types (~58 instances)

The most systematic issue across the codebase.

### Backend row mappers

DB row mapper functions use `row: any` instead of typed interfaces:

- `src/server/data/tracking/TrackingDb.ts:93` — `toTrackingSubject(row: any)`
- `src/server/data/RecurringExpenseDb.ts:147` — `mapRecurringExpense(row: any)`
- `src/server/data/grouping/GroupingDb.ts:249,265,277` — `toExpenseGrouping`, `toExpenseGroupingRef`, `toExpenseGroupingCategoryTotal`
- `src/server/data/UserDb.ts:6` — `RawUserData = Record<string, any>` used in session handling

### Error handling

- `src/server/server/ErrorHandler.ts:13,17,36-37` — error params and interface fields
- `src/server/notifications/ErrorLogger.ts:3` — `logError(err: any)`

### Logger instrumentation

- `src/server/logging/TraceIdProvider.ts:63,66,76,92` — Pino logger wrapping uses `any` casts

### ValidatingRouter

- `src/server/server/ValidatingRouter.ts:132,138` — `as any` casts in `createParamType`

### Shared code

- `src/shared/types/Api.ts:40,44,48` — type guard functions
- `src/shared/types/Errors.ts:5,11,13,14,36` — error cause/data
- `src/shared/util/Money.ts:59,63,148,156` — `isMoney()`, `isBig()`, math operations
- `src/shared/time/Time.ts:89,101` — `fromISODate()`, `iso()` accept `any`
- `src/shared/util/Util.ts:3,9,75` — string/number utilities

### Frontend

- `src/client/ui/icons/ExpenseType.tsx:7` — return type `any`, should be `React.ReactNode`
- `src/client/ui/search/SearchPage.tsx:38-39` — `Record<number, any>`, `any[]`
- `src/client/ui/component/ActivatableTextField.tsx:73` — `as any` cast
- `src/client/ui/expense/dialog/useExpenseDialog.ts:185,207,260` — Bacon.js stream types

## Plain interfaces missing Zod schemas

Types crossing API boundaries that lack runtime validation. Overlaps with the
response schema work tracked in thaapasa/bookkeeper#88.

- `Session`, `SessionBasicInfo` — `src/shared/types/Session.ts`
- `Group`, `Category`, `CategoryData`, `User` — `src/shared/types/Session.ts`
- `DbStatus`, `TypeStatus`, `ZeroSumData`, `InvalidDivision` — `src/shared/types/DbStatus.ts`
- `ExpenseShortcut` — `src/shared/expense/Shortcut.ts`
- `TrackingSubjectWithData`, `TrackingStatistics` — `src/shared/types/Tracking.ts`

## Frontend inline styles

Components using `style={{}}` for layout instead of Mantine style props:

- `src/client/ui/layout/BookkeeperPage.tsx:44-49` — height, flex, overflow
- `src/client/ui/layout/TopBar.tsx:98-104` — alignment, colors, transitions
- `src/client/ui/grouping/GroupingEditor.tsx:83-87` — grid layout
- `src/client/ui/shortcuts/ShortcutLink.tsx:42` — raw pixel margins
- `src/client/ui/general/LoginPage.tsx:44` — flexDirection
- `src/client/ui/tools/ToolButton.tsx:14` — alignItems

Components exposing `style?: React.CSSProperties` props where Mantine props would be
more idiomatic: `ActivatableTextField.tsx`, `UploadImageButton.tsx`, `ShortcutLink.tsx`.

## Bacon.js legacy

38 `.onValue()` call sites in the frontend. Known legacy pattern, not urgent, but worth
noting for future modernization.

## Process exit TODO

`src/server/server/ServerControl.ts:40` has a TODO asking why the process doesn't exit
naturally during shutdown. May indicate incomplete cleanup of async resources (timers,
open connections, event listeners).

## Test coverage gaps

Only ~17% of shared code has unit tests. Major gaps:

- Error handling (`src/shared/types/Errors.ts`)
- Type guards (`src/shared/types/Api.ts`)
- DateTime conversions (`src/shared/time/Time.ts`)
- Object/string/promise utilities
- All of `src/shared/userData/`
