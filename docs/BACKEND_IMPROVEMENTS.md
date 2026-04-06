# Backend Code Improvements Plan

This document captures suggestions for improving the backend codebase, identified during a code review on January 2026.

## High Priority

### 1. Missing Response Validation (Consistency Issue) — Phase 1 ✅ Done

Added `response:` Zod schemas to ~23 endpoints across 8 API files (ExpenseApi, SourceApi,
GroupingApi, StatisticsApi, ReportApi, ReceiverApi, SubscriptionApi, RecurringExpenseApi).

Remaining work tracked in [`docs/RESPONSE_SCHEMA_TODO.md`](RESPONSE_SCHEMA_TODO.md):
~33 endpoints still need schemas (most require converting TS interfaces to Zod schemas
or modifying void-returning DB functions).

---

### ~~2. Dead Code in Category Operations~~ ✅ Done

Removed unreachable null checks after `getCategoryById` in `createCategory`, `deleteCategory`, and `updateCategory`.

---

## Medium Priority

### ~~3. `ITask<any>` Loses Type Safety~~ ✅ Done

Defined `DbTask = ITask<object>` in `src/server/data/Db.ts` and replaced all `ITask<any>` usages.

---

### ~~4. Magic Boolean Fourth Parameter~~ ✅ Done

Moved `groupRequired` into the spec object. All API endpoints now use `{ groupRequired: true }` instead of a trailing boolean.

---

### ~~5. Catch-All `ApiMessage` Type~~ ✅ Done

Slimmed `ApiMessage` to just `status` + `message`. Created specific response types:
`ExpenseIdResponse`, `CategoryIdResponse`, `UserIdResponse`, `CountResponse`,
`RecurringExpenseCreatedResponse`. Updated server DB functions, API response schemas,
client API methods, and test helpers to use the specific types.

---

## Low Priority

### ~~6. Manual Parameter Parsing in Legacy Endpoints~~ ✅ Done

Migrated `/user/list`, `/user/:id`, and `/admin/status` endpoints in `Api.ts` to use `createValidatingRouter` with automatic parameter parsing.

---

### 7. Hard-coded Parameter Type Map

**Location**: `src/server/server/ValidatingRouter.ts` lines 22-32

**Problem**: New ID parameter names require manual additions to `TypeMap`.

**Solution**: Consider a more generic pattern (e.g., `*Id` suffix matching to `ObjectIdString`) or document this limitation clearly.

---

### ~~8. Loosely Typed Error Factory Functions~~ ✅ Done

Deleted `undefinedToError` and `emptyToError` — they were unused dead code.

---

## Implementation Order Recommendation

1. **Remove dead code** - Quick cleanup
2. **Add response schemas** - Gradual, can do per-endpoint
3. **Improve `ApiMessage` typing** - Can do alongside #2
4. **Fix `ITask<any>`** - Search and replace
5. **Other items** - As time permits

---

## Notes

- The codebase is generally well-structured with good patterns
- The `createValidatingRouter` abstraction is clever and provides good type safety
- The separation between API handlers, services, and DB operations is clean
- Consider adding these checks to a linting rule or PR checklist to prevent regression
