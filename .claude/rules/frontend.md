---
description: Frontend coding conventions for the Mantine 9 React UI
globs:
  - src/client/**/*.ts
  - src/client/**/*.tsx
---

# Frontend Conventions

Read `src/client/coding-conventions.md` for the full coding conventions. You must read
this file before writing any new code or when refactoring old code.

Key rules:

- Use Mantine components and style props, not raw HTML
- Use Mantine size tokens (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`) not raw pixels
- Use CSS modules for complex CSS (hover, pseudo-elements, animations)
- Rewrite legacy code from scratch with Mantine when touching files
- Run `bun format && bun lint` after changes
