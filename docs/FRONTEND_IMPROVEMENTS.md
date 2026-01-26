# Frontend Code Improvements Plan

This document captures suggestions for improving the frontend codebase, identified during a code review on January 2026.

## High Priority

### 1. Security: Logging Sensitive Token

**Location**: `src/client/data/Login.ts` line 46

**Problem**: Logs the actual refresh token value to console/logs.

```typescript
logger.info(`Not logged in but refresh token exists in localStorage: ${token}`);
```

**Impact**: Tokens in logs can be captured, exposing authentication credentials.

**Solution**:

```typescript
logger.info('Not logged in but refresh token exists in localStorage');
```

---

### 2. Memory Leak in `useAsyncData`

**Location**: `src/client/ui/hooks/useAsyncData.ts` lines 11-16

**Problem**: No cancellation mechanism for in-flight requests when component unmounts or dependencies change.

**Solution**:

```typescript
React.useEffect(() => {
  if (!valid) return;
  
  let cancelled = false;
  setData({ type: 'loading' });
  
  dataSource(...params)
    .then(value => {
      if (!cancelled) setData({ type: 'loaded', value });
    })
    .catch(error => {
      if (!cancelled) setData({ type: 'error', error });
    });
  
  return () => {
    cancelled = true;
  };
}, [valid, dataSource, ...params]);
```

---

### 3. Missing Cleanup in Bacon.js Subscriptions

**Locations**:
- `src/client/ui/component/DialogConnector.tsx` line 12
- `src/client/ui/component/BaconConnect.tsx` line 21

**Problem**: `bus.onValue()` returns an unsubscribe function that isn't being called on cleanup.

```typescript
// Current (leaks subscription)
React.useEffect(() => bus.onValue(setState), []);
```

**Solution**:

```typescript
React.useEffect(() => {
  const unsubscribe = bus.onValue(setState);
  return unsubscribe;
}, [bus]);
```

---

### 4. Object Mutation in `mapExpense`

**Location**: `src/client/data/ApiConnect.ts` lines 51-60

**Problem**: Mutates input objects directly, violating immutability principles.

```typescript
// Current (mutates input)
function mapExpense<T extends UserExpense>(e: T): T {
  e.userBenefit = Money.from(e.userBenefit, 0);
  // ... more mutations
  return e;
}
```

**Solution**:

```typescript
function mapExpense<T extends UserExpense>(e: T): T {
  return {
    ...e,
    userBenefit: Money.from(e.userBenefit, 0),
    userCost: Money.from(e.userCost, 0),
    userBalance: Money.from(e.userBalance, 0),
    userIncome: Money.from(e.userIncome, 0),
    userSplit: Money.from(e.userSplit, 0),
    userTransferor: Money.from(e.userTransferor, 0),
    userTransferee: Money.from(e.userTransferee, 0),
  };
}
```

---

### 5. Missing Error Handling in `saveExpense`

**Location**: `src/client/ui/expense/dialog/ExpenseDialog.tsx` lines 314-346

**Problem**: The `try` block has no `catch` clause; errors are silently swallowed.

**Solution**:

```typescript
try {
  const r = await (this.props.saveAction ?? defaultExpenseSaveAction)(data, this.props.original);
  // ... success handling
} catch (error) {
  logger.error(error, 'Failed to save expense');
  notifyError('Kirjauksen tallennus epäonnistui', error);
} finally {
  this.saveLock.push(false);
}
```

---

### 6. Generic Components Losing Type Safety

**Locations**:
- `src/client/ui/component/ActionButton.tsx` line 11
- `src/client/ui/component/AutoComplete.tsx` line 39

**Problem**: Components declared with `React.FC<Props<any>>` defeat generic type inference.

```typescript
// Current (loses type safety)
export const ActionButton: React.FC<ActionButtonProps<any>> = <T,>({ ... }) => { ... };
```

**Solution**:

```typescript
export const ActionButton = <T,>({
  onClick,
  children,
  ...props
}: ActionButtonProps<T>): React.ReactElement => {
  // ...
};
```

---

## Medium Priority

### 7. Unsafe Type Assertion in `Login.ts`

**Location**: `src/client/data/Login.ts` line 13

**Problem**: Using `as any` to silence TypeScript.

```typescript
export const validSessionE: B.EventStream<Session> = sessionP.filter(s => s !== null) as any;
```

**Solution**:

```typescript
export const validSessionE: B.EventStream<Session> = sessionP
  .filter((s): s is Session => s !== null)
  .map(s => s);
```

---

### 8. `any` Types in Error Handling

**Locations**:
- `src/client/data/AsyncData.ts` line 17: `error: any`
- `src/client/data/StateTypes.ts` line 8: `cause?: any`
- `src/client/data/State.ts` line 20: `cause: any`

**Solution**: Replace `any` with `unknown`:

```typescript
export interface AsyncDataError {
  type: 'error';
  error: unknown;
}
```

---

### 9. `any` Types in Hooks

**Locations**:
- `src/client/ui/hooks/useList.tsx` line 8
- `src/client/ui/hooks/useOnUnmount.tsx` line 8
- `src/client/ui/hooks/usePersistentMemo.tsx` lines 7, 25, 42
- `src/client/ui/hooks/useWhenMounted.tsx` line 11

**Solution**: Use proper types like `DependencyList` for dependency arrays:

```typescript
import type { DependencyList } from 'react';

export function useOnUnmount(f: () => void, deps?: DependencyList): void {
```

---

### 10. Swallowed Error in `useLocalStorage`

**Location**: `src/client/ui/hooks/useLocalStorage.ts` lines 45-46

**Problem**: Empty catch block silently swallows errors.

**Solution**:

```typescript
} catch (error) {
  logger.warn({ error, key }, 'Failed to read from localStorage, using default');
  return defaultValue;
}
```

---

### 11. Missing ResizeObserver in `useElementSize`

**Location**: `src/client/ui/hooks/useElementSize.ts` lines 27-34

**Problem**: Only responds to window resize, not element-specific size changes.

**Solution**: Use `ResizeObserver` instead of window resize listener.

---

### 12. Non-Reactive `useQueryParams`

**Location**: `src/client/ui/hooks/useQueryParams.ts` lines 3-13

**Problem**: Reads `window.location.search` during render but doesn't subscribe to URL changes.

**Solution**: Add `popstate` event listener to react to browser navigation.

---

### 13. Accessibility Issues

**Locations**:
- `src/client/ui/component/ActivatableTextField.tsx` lines 86-89: Missing keyboard support
- `src/client/ui/component/ColorPicker.tsx` line 51: No accessible names for color buttons

**Solution**: Add `role="button"`, `tabIndex={0}`, `aria-label`, and keyboard event handlers.

---

### 14. Deprecated `keyCode` API

**Locations**:
- `src/client/ui/component/DateRangeNavigator.tsx` lines 33-41
- `src/client/ui/component/ActivatableTextField.tsx` lines 54-63

**Problem**: `keyCode` is deprecated; should use `event.key`.

**Solution**:

```typescript
// Before
if (event.keyCode === KeyCodes.enter) { ... }

// After
if (event.key === 'Enter') { ... }
```

---

### 15. `window.prompt` Usage

**Location**: `src/client/ui/expense/dialog/ExpenseDialogComponents.tsx` lines 25-31

**Problem**: Using native `window.prompt` instead of the app's dialog system.

**Solution**: Use `UserPrompts.promptText` for consistent UI.

---

### 16. Class Component Could Be Functional

**Location**: `src/client/ui/component/NotificationBar.tsx` lines 34-89

**Problem**: Class component with complex state management could be more readable as a functional component with hooks.

---

## Low Priority

### 17. Wrong File Extensions

**Locations**: Multiple hook files use `.tsx` extension without JSX:
- `useForceReload.tsx`, `useList.tsx`, `useObjectMemo.tsx`, `useOnUnmount.tsx`, `usePersistentMemo.tsx`, `useWhenMounted.tsx`

**Solution**: Rename to `.ts` extension.

---

### 18. Typo in Component Name

**Location**: `src/client/ui/component/AsyncDataView.tsx` line 57

**Problem**: `UnitializedRenderer` should be `UninitializedRenderer`.

---

### 19. Redundant Code in `ExpenseRow`

**Location**: `src/client/ui/expense/row/ExpenseRow.tsx` lines 193-204

**Problem**: Style calculation is done twice (ternary + if/else).

---

### 20. Unnecessary Dependencies in useEffect

**Locations**: Multiple hooks include `setX` (useState setters) in dependency arrays.

**Note**: While not incorrect, it adds noise since setters are guaranteed stable.

---

### 21. Duplicate Constants

**Locations**:
- `src/client/ui/expense/dialog/ExpenseDialog.tsx` line 63
- `src/client/ui/expense/split/ExpenseSplitDialog.tsx` line 14

**Problem**: `AllowDialogEscape = false` defined in two files.

**Solution**: Extract to shared configuration file.

---

## Implementation Order Recommendation

1. **Security fix** (1) - Remove token from logs
2. **Memory leaks** (2-3) - Prevent React warnings and leaks
3. **Object mutation** (4) - Prevent subtle bugs
4. **Error handling** (5) - Users need feedback
5. **Type safety** (6-9) - Gradual improvement
6. **Accessibility** (13) - Important for inclusivity
7. **Deprecated APIs** (14) - Prevent future breakage
8. **Other items** - As time permits

---

## Patterns to Adopt

### Always Use Functional State Updates

When new state depends on old state:

```typescript
// Bad - stale closure risk
setCount(count + 1);

// Good - always gets latest state
setCount(c => c + 1);
```

### Always Clean Up Subscriptions

```typescript
React.useEffect(() => {
  const unsubscribe = stream.onValue(handler);
  return unsubscribe;  // Always return cleanup
}, [stream]);
```

### Prefer `unknown` Over `any`

```typescript
// Bad - defeats type checking
catch (error: any) { ... }

// Good - forces explicit type narrowing
catch (error: unknown) {
  if (error instanceof Error) { ... }
}
```

### Memoize Callbacks Passed to Children

```typescript
const handleClick = React.useCallback(() => {
  doSomething(id);
}, [id]);

return <Child onClick={handleClick} />;
```

---

## Notes

- The codebase has good separation of concerns and consistent patterns overall
- The Bacon.js reactive streams work well but require careful cleanup
- Consider gradual migration of remaining class components to functional
- The `createValidatingRouter` pattern on the backend is well-designed; similar validation patterns could benefit the frontend
