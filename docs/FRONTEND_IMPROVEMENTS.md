# Frontend Code Improvements Plan

This document captures suggestions for improving the frontend codebase, identified during a code review on January 2026. Status last updated April 2026.

## Medium Priority

### ~~1. `any` Types in Hooks~~ ✅ Fixed

All hooks now use proper types (`DependencyList`, generics, `unknown`).

---

### ~~2. Missing ResizeObserver in `useElementSize`~~ ✅ Removed

The `useElementSize` hook has been removed from the codebase.

---

### ~~3. Non-Reactive `useQueryParams`~~ ✅ Fixed

Custom `useQueryParams` hook removed and replaced with React Router's `useSearchParams`.

---

### ~~4. Accessibility Issues~~ ✅ Fixed

Added `role="button"`, `tabIndex={0}`, `aria-label`, and keyboard event handlers to ActivatableTextField view mode and ColorPicker buttons.

---

### ~~5. Deprecated `keyCode` API~~ ✅ Fixed

All `keyCode` usage has been replaced with `event.key`.

---

### ~~6. `window.prompt` Usage~~ ✅ Fixed

Replaced `window.prompt` + plus icon with inline arithmetic expression evaluation.
The sum field now accepts expressions like `124.42 - 23.42 + 3.33` and evaluates on blur.

---

### ~~7. Class Component Could Be Functional~~ ✅ Fixed

All class components have been converted to functional components.

---

## Low Priority

### ~~8. Wrong File Extensions~~ ✅ Fixed

All hook files renamed from `.tsx` to `.ts`.

---

### ~~9. Redundant Code in `ExpenseRow`~~ ✅ Fixed

The redundant style calculation has been cleaned up.

---

### ~~10. Duplicate Constants~~ ✅ Fixed (OBE)

The `AllowDialogEscape` constant no longer exists. Both dialog files now use Mantine's `closeOnEscape={false}` prop directly.

---

### ~~11. Token Logged to Console~~ ✅ Fixed

Token is now truncated to first 4 characters in the log message.

---

## Implementation Order Recommendation

1. **Accessibility** (4) - Important for inclusivity
2. **Other items** - As time permits

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
- All components are now functional (no class components remain)
- The Bacon.js reactive streams work well but require careful cleanup
- The `createValidatingRouter` pattern on the backend is well-designed; similar validation patterns could benefit the frontend
