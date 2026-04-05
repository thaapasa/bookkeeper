# Frontend Code Improvements Plan

This document captures suggestions for improving the frontend codebase, identified during a code review on January 2026.

## Medium Priority

### 1. `any` Types in Hooks

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

### 2. Missing ResizeObserver in `useElementSize`

**Location**: `src/client/ui/hooks/useElementSize.ts` lines 27-34

**Problem**: Only responds to window resize, not element-specific size changes.

**Solution**: Use `ResizeObserver` instead of window resize listener.

---

### 3. Non-Reactive `useQueryParams`

**Location**: `src/client/ui/hooks/useQueryParams.ts` lines 3-13

**Problem**: Reads `window.location.search` during render but doesn't subscribe to URL changes.

**Solution**: Add `popstate` event listener to react to browser navigation.

---

### 4. Accessibility Issues

**Locations**:
- `src/client/ui/component/ActivatableTextField.tsx` lines 86-89: Missing keyboard support
- `src/client/ui/component/ColorPicker.tsx` line 51: No accessible names for color buttons

**Solution**: Add `role="button"`, `tabIndex={0}`, `aria-label`, and keyboard event handlers.

---

### ~~5. Deprecated `keyCode` API~~ ✅ Fixed

All `keyCode` usage has been replaced with `event.key`.

---

### 6. `window.prompt` Usage

**Location**: `src/client/ui/expense/dialog/ExpenseDialogComponents.tsx` lines 25-31

**Problem**: Using native `window.prompt` instead of the app's dialog system.

**Solution**: Use `UserPrompts.promptText` for consistent UI.

---

### ~~7. Class Component Could Be Functional~~ ✅ Fixed

All class components have been converted to functional components.

---

## Low Priority

### 8. Wrong File Extensions

**Locations**: Multiple hook files use `.tsx` extension without JSX:
- `useForceReload.tsx`, `useList.tsx`, `useObjectMemo.tsx`, `useOnUnmount.tsx`, `usePersistentMemo.tsx`, `useWhenMounted.tsx`

**Solution**: Rename to `.ts` extension.

---

### 9. Redundant Code in `ExpenseRow`

**Location**: `src/client/ui/expense/row/ExpenseRow.tsx` lines 193-204

**Problem**: Style calculation is done twice (ternary + if/else).

---

### 10. Duplicate Constants

**Locations**:
- `src/client/ui/expense/dialog/ExpenseDialog.tsx` line 63
- `src/client/ui/expense/split/ExpenseSplitDialog.tsx` line 14

**Problem**: `AllowDialogEscape = false` defined in two files.

**Solution**: Extract to shared configuration file.

---

### 11. Token Logged to Console

**Location**: `src/client/data/Login.ts` line 46

**Problem**: Logs the refresh token value to browser console.

```typescript
logger.info(`Not logged in but refresh token exists in localStorage: ${token}`);
```

**Note**: Not a security issue since browser console is only visible to the token owner, but good practice not to log credentials.

**Solution**:

```typescript
logger.info('Not logged in but refresh token exists in localStorage');
```

---

## Implementation Order Recommendation

1. **Type safety** (1) - Replace `any` with proper types
2. **Accessibility** (4) - Important for inclusivity
3. **Deprecated APIs** (5) - Prevent future breakage
4. **Other items** - As time permits

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
