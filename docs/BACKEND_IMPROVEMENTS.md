# Backend Code Improvements Plan

This document captures suggestions for improving the backend codebase, identified during a code review on January 2026.

## High Priority

### 1. Double Transaction Wrapping (Performance Issue)

**Location**: `src/server/server/RequestHandling.ts`

**Problem**: Authenticated requests open two separate transactions per request:
1. Line 48: Opens a transaction to fetch the session
2. Line 66: Opens another transaction for the actual handler

**Impact**: Every authenticated request with a transaction handler opens two DB transactions sequentially, adding unnecessary round-trip latency.

**Solution**: Refactor to use a single transaction that both fetches the session and executes the handler. The `processTxRequest` function should pass its transaction to `getSessionByToken` instead of the session lookup creating its own.

---

### 2. Missing Response Validation (Consistency Issue)

**Location**: Various API files in `src/server/api/`

**Problem**: Some endpoints validate responses with a schema, others don't:
```typescript
// No response validation
api.getTx('/list', {}, (tx, session) => getAllCategories(tx, session.group.id), true);

// Has response validation  
api.postTx('/', { body: CategoryInput, response: ApiMessage }, ...);
```

**Impact**: Inconsistent runtime safety and type inference.

**Solution**: Always specify response schemas for all endpoints.

---

### 3. Dead Code in Category Operations

**Location**: `src/server/data/CategoryDb.ts`

**Problem**: In `createCategory` (lines 118-122) and `deleteCategory` (lines 134-137), there are unreachable null checks after calling `getCategoryById`, which already throws `NotFoundError` if not found.

**Solution**: Remove the redundant null checks:
```typescript
// Before
const parent = await getCategoryById(tx, groupId, data.parentId);
if (!parent) {  // This is never true
  throw new NotFoundError('CATEGORY_NOT_FOUND', 'category');
}

// After
const parent = await getCategoryById(tx, groupId, data.parentId);
// getCategoryById throws if not found, so we can proceed directly
```

---

## Medium Priority

### 4. `ITask<any>` Loses Type Safety

**Location**: All database files in `src/server/data/`

**Problem**: All 150+ usages of `ITask<any>` defeat TypeScript's type checking.

**Solution**: Define a typed database context:
```typescript
// In src/server/data/Db.ts
export type DbTask = ITask<{}>;

// Then use throughout
export async function getAllCategories(tx: DbTask, groupId: number): Promise<Category[]>
```

---

### 5. Magic Boolean Fourth Parameter

**Location**: All API files using `createValidatingRouter`

**Problem**: The `true` at the end of handler registrations means "group required" but isn't self-documenting:
```typescript
api.deleteTx('/:categoryId', { response: ApiMessage }, handler, true);
```

**Solution**: Change the API to accept an options object:
```typescript
api.deleteTx('/:categoryId', { response: ApiMessage, groupRequired: true }, handler);
```

This requires modifying `ValidatingRouter.ts`.

---

### 6. Redundant TypeScript `Omit` Definition

**Location**: `src/shared/util/Objects.ts` line 5

**Problem**: Custom `Omit` type is defined, but this has been built into TypeScript since version 3.5.

**Solution**: Remove the custom definition and use the built-in `Omit`.

---

### 7. Catch-All `ApiMessage` Type

**Location**: `src/shared/types/Api.ts`

**Problem**: Single type with many optional fields used for all mutation responses:
```typescript
export const ApiMessage = z.object({
  status: z.string(),
  message: z.string(),
  userId: ObjectId.optional(),
  expenseId: ObjectId.optional(),
  templateExpenseId: ObjectId.optional(),
  recurringExpenseId: ObjectId.optional(),
  categoryId: ObjectId.optional(),
  count: z.number().int().optional(),
});
```

**Impact**: Can't tell at the type level what a specific endpoint returns.

**Solution**: Define specific response types per operation:
```typescript
export const CreateExpenseResponse = ApiMessage.extend({
  expenseId: ObjectId,
});

export const DeleteCategoryResponse = ApiMessage.extend({
  categoryId: ObjectId,
});
```

---

## Low Priority

### 8. Manual Parameter Parsing in Legacy Endpoints

**Location**: `src/server/api/Api.ts` lines 59-72

**Problem**: Some endpoints manually parse parameters instead of using `createValidatingRouter`:
```typescript
Requests.txRequest(
  (tx, session, req): Promise<User> =>
    getUserById(tx, session.group.id, parseInt(String(req.params.id), 10)),
  true,
)
```

**Solution**: Migrate these endpoints to use `createValidatingRouter` for consistency.

---

### 9. Hard-coded Parameter Type Map

**Location**: `src/server/server/ValidatingRouter.ts` lines 22-32

**Problem**: New ID parameter names require manual additions to `TypeMap`.

**Solution**: Consider a more generic pattern (e.g., `*Id` suffix matching to `ObjectIdString`) or document this limitation clearly.

---

### 10. Loosely Typed Error Factory Functions

**Location**: `src/shared/types/Errors.ts` lines 4-22

**Problem**: `undefinedToError` and `emptyToError` use `any` types extensively.

**Solution**: Add proper generics:
```typescript
export function undefinedToError<E extends BkError>(
  ErrorClass: new (...args: any[]) => E,
  ...args: ConstructorParameters<typeof ErrorClass>
) {
  return <T>(value: T | undefined): T => {
    if (value === undefined) {
      throw new ErrorClass(...args);
    }
    return value;
  };
}
```

---

### 11. Config Class Pattern

**Location**: `src/server/Config.ts`

**Problem**: Using a class with only public fields that's instantiated once is unusual.

**Solution**: Consider using a plain const object:
```typescript
export const config = {
  environment: env,
  version: revision.version,
  // ...
} as const satisfies ConfigType;
```

---

## Tech Debt

### 12. Bun AsyncLocalStorage Bug Workaround

**Location**: `src/server/logging/TraceIdFix.ts`

**Problem**: The `fixDbTraceLeak()` function is a hack to work around a Bun bug with AsyncLocalStorage leaking state on transaction rollback.

**Action**: 
- Track this as tech debt
- Add a link to a Bun GitHub issue in the comment
- Remove when Bun fixes the issue
- Periodically check if the bug has been fixed in newer Bun versions

---

## Implementation Order Recommendation

1. **Double transaction wrapping** - Biggest performance win
2. **Remove dead code** - Quick cleanup
3. **Add response schemas** - Gradual, can do per-endpoint
4. **Improve `ApiMessage` typing** - Can do alongside #3
5. **Fix `ITask<any>`** - Search and replace
6. **Other items** - As time permits

---

## Notes

- The codebase is generally well-structured with good patterns
- The `createValidatingRouter` abstraction is clever and provides good type safety
- The separation between API handlers, services, and DB operations is clean
- Consider adding these checks to a linting rule or PR checklist to prevent regression
