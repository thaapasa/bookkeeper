---
description: Backend coding conventions for the Express + pg-promise server
globs:
  - src/server/**/*.ts
  - migrations/**/*.js
---

# Backend Conventions

Read `src/server/coding-conventions.md` for the full coding conventions. You must read
this file before writing any new code or when refactoring old code.

Key rules:

- Use `createValidatingRouter` with Zod schemas for all API endpoints
- Use pg-promise parameterized queries (`$/param/` syntax), never string interpolation
- Use typed errors from `shared/types/Errors`
- Use Pino logger with context object first
- Use branded date string types (`ISODate`, `ISOTimestamp`), never raw DateTime objects
- Wrap data-layer write operations and slow reads in OTel spans via
  `withSpan` from `server/telemetry/Spans`
- Run `bun format && bun lint` after changes
