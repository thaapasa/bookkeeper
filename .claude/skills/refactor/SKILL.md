---
name: refactor
description: Refactor outdated patterns in the codebase based on user input
argument-hint: <pattern to refactor, e.g. "Emotion styled to Mantine" or "class components to functional">
disable-model-invocation: true
---

# Refactoring: $ARGUMENTS

Systematically find and convert all instances of the outdated pattern described above.

## Process

1. **Understand the target**: Parse the refactoring description to identify the
   old pattern and the desired new pattern.

2. **Survey the codebase**: Search for all instances of the old pattern. Use grep/glob
   to find every occurrence. Report the full scope before making changes:
   - How many files are affected
   - Which directories contain the most instances
   - Any tricky cases that need special attention

3. **Plan the approach**: Present a migration plan:
   - Group files by complexity (simple mechanical replacements vs. files needing redesign)
   - Identify dependencies between files (change order matters)
   - Flag any files where the refactoring might change behavior

4. **Get approval**: Show the plan and ask the user to confirm scope before proceeding.
   The user may want to do it all at once or in batches.

5. **Execute**: For each file:
   - Apply the refactoring
   - Ensure imports are updated
   - Verify the file is self-consistent after changes

6. **Verify**: After all changes, run `bun lint` to catch type errors and lint issues.
   Fix any issues introduced by the refactoring.

## Common Refactoring Targets

These are known legacy patterns in this codebase:

- **Emotion `styled` to Mantine**: Replace `styled.div`/`styled('div')` wrappers with
  Mantine components + style props. Don't wrap Mantine components with `styled()`.
- **MUI to Mantine**: Replace `@mui/material` imports with `@mantine/core` equivalents.
- **Class to functional components**: Convert `React.Component` classes to functional
  components with hooks.
- **Bacon.js to Zustand**: Replace reactive stream patterns with Zustand stores.
- **`any` types**: Replace `any` with proper TypeScript types.
- **Raw SQL strings**: Ensure all queries use `$/param/` parameterization.

## Rules

- Do not change behavior — refactoring is structural, not functional.
- Run `bun lint` after each batch of changes to catch issues early.
- If a file is complex, show the before/after diff concept before applying.
- Keep commits atomic — one logical change per commit when the user asks to commit.
