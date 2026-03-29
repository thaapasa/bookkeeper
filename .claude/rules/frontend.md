---
description: Frontend coding conventions for the Mantine 8 React UI
globs:
  - src/client/**/*.ts
  - src/client/**/*.tsx
---

# Frontend Conventions

Read `src/client/coding-conventions.md` for the full coding conventions. You must read
this file before writing any new code or when refactoring old code.

Key rules:

- Use Mantine components and style props, not raw HTML or Emotion styled wrappers
- Use Mantine size tokens (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`) not raw pixels
- Use CSS modules for complex CSS (hover, pseudo-elements, animations)
- Only use Emotion `styled` when no Mantine or CSS module alternative exists
- Never wrap Mantine components with `styled()` — use `styled.div` if needed
- Rewrite legacy code from scratch with Mantine when touching files
- Convert class components to functional components
- Run `bun format && bun lint` after changes
