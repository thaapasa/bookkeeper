---
name: review-docs
description: Review documentation for accuracy against the current implementation. Use when documentation files are modified, when code changes may have made docs outdated, or when the user asks about documentation accuracy.
paths:
  - "*.md"
  - docs/**
  - .claude/**
  - .github/**
  - src/client/coding-conventions.md
---

# Documentation Review

Audit all documentation files for accuracy against the actual codebase.
Truth lives in the code — docs must reflect reality.

## Files to Review

Check each of these files:

- `README.md`
- `CLAUDE.md`
- `src/client/CLAUDE.md`
- `src/client/coding-conventions.md`
- `src/server/CLAUDE.md`
- `src/server/coding-conventions.md`
- `docs/ARCHITECTURE.md` (if exists)
- `docs/FRONTEND_IMPROVEMENTS.md` (if exists)
- `docs/BACKEND_IMPROVEMENTS.md` (if exists)
- `.claude/agents/review.md`
- `.claude/rules/*.md`

## For Each File, Verify

1. **File paths** — Do referenced files/directories actually exist?
2. **Code examples** — Do they match actual API signatures and current patterns?
3. **Commands** — Are `bun` scripts listed actually defined in `package.json`?
4. **Technology claims** — Do stated libraries/versions match `package.json`?
5. **Patterns** — Do documented patterns match how the code is actually written?
6. **Cross-references** — Do links between docs point to valid files?

## Consistency Check

All documentation sources (CLAUDE.md, agent configs, Cursor rules, Claude rules)
should agree on:

- Technology stack (React version, UI library, state management)
- Code patterns (router pattern, DB access, component structure)
- Import conventions and path aliases
- Error handling approach

## Output

Number each finding sequentially so the user can reference them (e.g. "fix 2 and 5,
leave 3 as-is"). Format:

```
#1
[FILE] path/to/file.md
[LINE] approximate location
[ISSUE] what's wrong
[FIX] what it should say (or "remove" if obsolete)
```

After listing all issues, summarize:
- Total issues found per file
- Which files are up to date
- Which files need the most attention

Ask the user which fixes to apply before making changes.
