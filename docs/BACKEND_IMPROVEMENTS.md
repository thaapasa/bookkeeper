# Backend Code Improvements Plan

This document captures suggestions for improving the backend codebase, identified during a code review on January 2026.

## High Priority

### 1. Missing Response Validation (Consistency Issue)

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

### 2. Dead Code in Category Operations

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

### 3. `ITask<any>` Loses Type Safety

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

### 4. Magic Boolean Fourth Parameter

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

### 5. Catch-All `ApiMessage` Type

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

### 6. Manual Parameter Parsing in Legacy Endpoints

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

### 7. Hard-coded Parameter Type Map

**Location**: `src/server/server/ValidatingRouter.ts` lines 22-32

**Problem**: New ID parameter names require manual additions to `TypeMap`.

**Solution**: Consider a more generic pattern (e.g., `*Id` suffix matching to `ObjectIdString`) or document this limitation clearly.

---

### 8. Loosely Typed Error Factory Functions

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

## Tech Debt

### 9. Bun AsyncLocalStorage Bug Workaround

**Location**: `src/server/logging/TraceIdFix.ts`

**Problem**: The `fixDbTraceLeak()` function is a hack to work around a Bun bug with AsyncLocalStorage leaking state on transaction rollback.

**Action**: 
- Track this as tech debt
- Add a link to a Bun GitHub issue in the comment
- Remove when Bun fixes the issue
- Periodically check if the bug has been fixed in newer Bun versions

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
