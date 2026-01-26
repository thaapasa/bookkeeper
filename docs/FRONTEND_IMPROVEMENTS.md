# Frontend Code Improvements Plan

This document captures suggestions for improving the frontend codebase, identified during a code review on January 2026.

## Critical Priority

### 1. Bug: Incorrect API Call Structure in `createReport`

**Location**: `src/client/data/ApiConnect.ts` line 421

**Problem**: The `createReport` method passes the body directly instead of wrapping it in `{ body }`, inconsistent with all other POST methods.

```typescript
// Current (broken)
return this.post<ReportDef>(uri`/api/report`, body);

// All other methods use
return this.post<SomeType>(url, { body: data });
```

**Impact**: The `createReport` endpoint likely fails or sends malformed data.

**Solution**:

```typescript
public createReport = (title: string, query: ExpenseQuery): Promise<ReportDef> => {
  const body: ReportCreationData = {
    title,
    query: filterDefinedProps(query),
  };
  return this.post<ReportDef>(uri`/api/report`, { body });
};
```

---

### 2. Stale Closure Bug in `useToggle`

**Location**: `src/client/ui/hooks/useToggle.ts` line 5

**Problem**: The toggle callback captures `status` in its closure. Rapid calls use the same stale value.

```typescript
// Current (buggy)
const toggle = React.useCallback(() => setStatus(!status), [status, setStatus]);
```

**Impact**: Double-clicking or rapid toggles only toggle once instead of twice.

**Solution**:

```typescript
const toggle = React.useCallback(() => setStatus(s => !s), []);
```

---

### 3. Stale Closure Bug in `useForceReload`

**Location**: `src/client/ui/hooks/useForceReload.tsx` lines 4-5

**Problem**: Same stale closure issue as `useToggle`.

```typescript
// Current (buggy)
const forceReload = React.useCallback(() => setCounter(counter + 1), [setCounter, counter]);
```

**Solution**:

```typescript
const forceReload = React.useCallback(() => setCounter(c => c + 1), []);
```

---

### 4. Side Effect During Render in `useWhenChanged`

**Location**: `src/client/ui/hooks/useWhenChanged.ts` lines 16-18

**Problem**: The callback is invoked during the render phase, violating React's rules.

```typescript
// Current (violates React rules)
if (prevValue !== value) {
  callback?.(value, prevValue);  // Side effect in render!
  return value;
}
```

**Impact**: Bugs in Concurrent Mode, breaks Strict Mode double-render detection.

**Solution**:

```typescript
export function useWhenChanged<T>(
  value: T,
  callback?: (newValue: T, oldValue: T | undefined) => void,
): T | undefined {
  const prevValue = usePrevious(value);
  const changed = prevValue !== value;

  React.useEffect(() => {
    if (changed && callback) {
      callback(value, prevValue);
    }
  }, [changed, value, prevValue, callback]);

  return changed ? value : undefined;
}
```

---

### 5. State Mutation in `ExpenseTable.removeFilter`

**Location**: `src/client/ui/expense/ExpenseTable.tsx` lines 56-61

**Problem**: Directly mutates state array with `splice()`.

```typescript
// Current (mutates state)
this.setState(s => {
  s.filters.splice(index, 1);
  return s;
});
```

**Impact**: React may not detect the change, causing missed re-renders.

**Solution**:

```typescript
private removeFilter = (index: number) => {
  this.setState(s => ({
    filters: s.filters.filter((_, i) => i !== index),
  }));
};
```

---

## High Priority

### 6. Security: Logging Sensitive Token

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

### 7. Memory Leak in `useAsyncData`

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

### 8. Missing Cleanup in Bacon.js Subscriptions

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

### 9. Object Mutation in `mapExpense`

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

### 10. Missing Error Handling in `saveExpense`

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

### 11. Generic Components Losing Type Safety

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

### 12. Unsafe Type Assertion in `Login.ts`

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

### 13. `any` Types in Error Handling

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

### 14. `any` Types in Hooks

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

### 15. Swallowed Error in `useLocalStorage`

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

### 16. Missing ResizeObserver in `useElementSize`

**Location**: `src/client/ui/hooks/useElementSize.ts` lines 27-34

**Problem**: Only responds to window resize, not element-specific size changes.

**Solution**: Use `ResizeObserver` instead of window resize listener.

---

### 17. Non-Reactive `useQueryParams`

**Location**: `src/client/ui/hooks/useQueryParams.ts` lines 3-13

**Problem**: Reads `window.location.search` during render but doesn't subscribe to URL changes.

**Solution**: Add `popstate` event listener to react to browser navigation.

---

### 18. Accessibility Issues

**Locations**:
- `src/client/ui/component/ActivatableTextField.tsx` lines 86-89: Missing keyboard support
- `src/client/ui/component/ColorPicker.tsx` line 51: No accessible names for color buttons

**Solution**: Add `role="button"`, `tabIndex={0}`, `aria-label`, and keyboard event handlers.

---

### 19. Deprecated `keyCode` API

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

### 20. `window.prompt` Usage

**Location**: `src/client/ui/expense/dialog/ExpenseDialogComponents.tsx` lines 25-31

**Problem**: Using native `window.prompt` instead of the app's dialog system.

**Solution**: Use `UserPrompts.promptText` for consistent UI.

---

### 21. Class Component Could Be Functional

**Location**: `src/client/ui/component/NotificationBar.tsx` lines 34-89

**Problem**: Class component with complex state management could be more readable as a functional component with hooks.

---

## Low Priority

### 22. Wrong File Extensions

**Locations**: Multiple hook files use `.tsx` extension without JSX:
- `useForceReload.tsx`, `useList.tsx`, `useObjectMemo.tsx`, `useOnUnmount.tsx`, `usePersistentMemo.tsx`, `useWhenMounted.tsx`

**Solution**: Rename to `.ts` extension.

---

### 23. Typo in Component Name

**Location**: `src/client/ui/component/AsyncDataView.tsx` line 57

**Problem**: `UnitializedRenderer` should be `UninitializedRenderer`.

---

### 24. Redundant Code in `ExpenseRow`

**Location**: `src/client/ui/expense/row/ExpenseRow.tsx` lines 193-204

**Problem**: Style calculation is done twice (ternary + if/else).

---

### 25. Unnecessary Dependencies in useEffect

**Locations**: Multiple hooks include `setX` (useState setters) in dependency arrays.

**Note**: While not incorrect, it adds noise since setters are guaranteed stable.

---

### 26. Duplicate Constants

**Locations**:
- `src/client/ui/expense/dialog/ExpenseDialog.tsx` line 63
- `src/client/ui/expense/split/ExpenseSplitDialog.tsx` line 14

**Problem**: `AllowDialogEscape = false` defined in two files.

**Solution**: Extract to shared configuration file.

---

## Implementation Order Recommendation

1. **Critical fixes** (1-5) - Fix immediately, can cause bugs
2. **Security fix** (6) - Remove token from logs
3. **Memory leaks** (7-8) - Prevent React warnings and leaks
4. **Error handling** (10) - Users need feedback
5. **Type safety** (11-14) - Gradual improvement
6. **Accessibility** (18) - Important for inclusivity
7. **Deprecated APIs** (19) - Prevent future breakage
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
