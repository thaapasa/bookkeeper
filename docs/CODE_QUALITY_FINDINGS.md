# Code Quality Findings

Issues identified during a codebase scan in April 2026. Organized by priority.

## `any` types (~35 remaining)

Reduced from ~58 after fixing shared types, error handling, and simple frontend cases.

### Backend row mappers

DB row mapper functions use `row: any` instead of typed interfaces:

- `src/server/data/tracking/TrackingDb.ts:93` — `toTrackingSubject(row: any)`
- `src/server/data/RecurringExpenseDb.ts:147` — `mapRecurringExpense(row: any)`
- `src/server/data/grouping/GroupingDb.ts:249,265,277` — `toExpenseGrouping`, `toExpenseGroupingRef`, `toExpenseGroupingCategoryTotal`
- `src/server/data/UserDb.ts:6` — `RawUserData = Record<string, any>` used in session handling

### Logger instrumentation

- `src/server/logging/TraceIdProvider.ts:63,66,76,92` — Pino logger wrapping uses `any` casts

### ValidatingRouter

- `src/server/server/ValidatingRouter.ts:132,138` — `as any` casts in `createParamType`

### Shared utilities

Structural `as any` casts in generic object/array helpers:

- `src/shared/util/Objects.ts:9,18,21,29,57,65` — `as any` in `pick`, `omit`, `mapObject`, `recordFromPairs`
- `src/shared/util/Arrays.ts:91,95,115,126,127` — `valuesToArray`, `arrayContains`, `groupBy`, `typedFilter`
- `src/shared/util/Util.ts:31` — `camelCaseObject` internal casts
- `src/shared/util/Strings.ts:19` — template tag `...keys: any[]`
- `src/shared/util/Assert.ts:9` — `fail(message, cause?: any)`
- `src/shared/util/Promise.ts:3` — `isPromise(t: any)` type guard

### Shared types

- `src/shared/expense/Splitter.ts:27,50` — `as any` casts in division mapping
- `src/shared/types/Common.ts:10` — `isDbObject(e: any)` type guard
- `src/shared/types/Validation.ts:29` — constructor `data: any` param
- `src/shared/net/FetchClient.ts:10,23,24,47,132` — HTTP client types
- `src/shared/net/UrlUtils.ts:22` — `uri` template tag

### Frontend

- `src/client/ui/expense/dialog/useExpenseDialog.ts:126,128,185,207,260` — Bacon.js stream types
- `src/client/ui/component/ActivatableTextField.tsx:16,27,28,73` — generic component type casts
- `src/client/ui/dialog/` — generic dialog system types (`Dialog.ts`, `ModalDialog.tsx`, etc.)
- `src/client/ui/component/` — `AsyncDataView.tsx`, `AsyncDataDialog.tsx`, `ListDecorator.tsx` component casts
- `src/client/ui/search/SearchPage.tsx:51` — `B.mergeAll<any>` (Bacon.js)
- `src/client/ui/statistics/category/` — chart config casts

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
