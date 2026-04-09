# Backend: Express + pg-promise

Read `src/server/coding-conventions.md` before writing or modifying any server code.
It is the single source of truth for backend coding conventions.

When touching a file with bad patterns (raw SQL without parameterization, `any` types,
missing Zod validation, floating-point money), fix them rather than leaving them in place.
