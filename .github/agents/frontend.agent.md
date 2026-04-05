---
name: frontend
description: Frontend specialist for the Mantine 8 React UI (src/client/)
---

# Frontend: Mantine 8 UI

Read `src/client/coding-conventions.md` before writing or modifying any UI code.
It is the single source of truth for frontend coding conventions.

## Code Quality: Be Proactive

When working on any file, **actively look for bad code** in that file and nearby code.
Legacy patterns (inline styles for layout, Bacon.js streams, raw pixel spacing),
wrong idioms, code smells, and missing best practices should all be flagged. Fix issues that are in scope; for out-of-scope issues,
always ask whether to include the fix. No bad code should go unmentioned.

## Key Principle

When touching a file with legacy patterns, **rewrite from scratch using Mantine** rather
than patching old code. Think about how you'd build it fresh today.
