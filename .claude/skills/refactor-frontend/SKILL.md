---
name: refactor-frontend
description: Refactor frontend components to follow Mantine coding conventions. Use when asked to refactor, modernize, or clean up UI code.
argument-hint: <file, directory, or pattern to refactor>
---

# Frontend Refactoring: $ARGUMENTS

You MUST read `src/client/coding-conventions.md` before making any changes.
Every change must conform to the conventions in that file.

## Approach

You are not patching old code — you are rewriting it from scratch using the conventions.
For each file, think about how you would build the component fresh if starting today, then write that.
This may involve breaking the layout or structure of the existing code to fit the new patterns.
You only need to retain the functionality of the components, not the exact layout. The old code used
custom CSS to achieve what Mantine's theme and standard styles can do out of the box. After refactoring,
the code should be simple and clean, using Mantine's theming to lay out the elements in a clean fashion.
Any design work on the UI will be performed after the refactoring.

## Checklist for each file

Apply all of these:

1. **Replace Emotion styled wrappers** with Mantine components + style props.
   Simple layout wrappers (`styled.div` with flex, padding, margins, position) become
   `Box`, `Group`, `Stack`, `Flex` with Mantine props.
2. **Replace raw pixel values** with Mantine size tokens for spacing, padding, margins,
   gaps (`p="md"` not `p={16}`, `gap="sm"` not `gap={12}`).
3. **Replace inline style={{}}** with Mantine style props where possible
   (`c="primary.7"` not `style={{ color: '...' }}`, `bg="neutral.1"` not
   `style={{ backgroundColor: '...' }}`).
4. **Replace raw HTML elements** (`div`, `span`) with Mantine components
   (`Box`, `Text`, `Group`).
5. **Use Mantine component props** over CSS overrides (`visibleFrom`, `hiddenFrom`,
   `withRowBorders`, `truncate`).
6. **Convert class components** to functional components with hooks.
7. **Remove unused imports and dead code** — don't leave commented-out code or
   backwards-compat shims.
8. **Fix file/type naming** if names are misleading or generic.
9. **Move CSS to CSS modules** when `style` prop or Emotion is used for hover states,
   pseudo-elements, or complex selectors.
10. **Remove .tsx/.ts extensions** from import paths.

## CSS styling

Do not use Emotion. Prefer:

- Mantine style props (simplest)
- Mantine `style` prop (one-off CSS)
- CSS modules (complex or reusable CSS)

## Process

1. Read the target files and `src/client/coding-conventions.md`.
2. Identify the functionality of the components in the file and how they fit together.
3. Consider component and file names and their location - do they make sense? If not, rename or move them,
   extracting components into new files if needed.
4. Rewrite the components from scratch using Mantine components and style props, following the conventions.
5. Discard any custom styling to produce a simple, clean layout.
6. Run `bun format && bun lint` after changes
7. Fix any type or lint errors introduced

## Rules

- Do not change behavior — refactoring is structural, not functional
- Discard custom styling, simplify to Mantine baseline
- Preserve all user-visible functionality
- Do not commit, user will review changes and commit when ready
