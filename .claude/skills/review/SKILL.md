---
name: review
description: Review code changes from a specific angle or do a general pass. Use when the user wants a code review of their current branch or specific changes. For a thorough review covering all checks, use the @agent-review subagent instead.
argument-hint: <optional: angle to review from, e.g. "security", "convention compliance", "completeness of the refactoring">
---

# Code Review

Review the code changes and report issues.

## Step 1: Determine Scope and Intent

Figure out **what** to review and **what the changes are supposed to do**.

**What to review:**

- If the user provided a PR URL or specific files, review those.
- Otherwise, review all changes in the current branch compared to the main branch.
  Run `git log main..HEAD --oneline` and `git diff main...HEAD` to see the full scope.
- If the branch _is_ main (no divergence), fall back to uncommitted changes (`git diff`
  and `git diff --cached`), or the last commit (`git diff HEAD~1`).

**Intent of the changes:**

- If the user described the intent via `$ARGUMENTS`, use that as the primary guide
  for what angle to review from.
- Otherwise, infer intent from: commit messages, PR description, any added/modified
  documentation, plan files, or TODO comments in the diff.
- Summarize the intent in 1-2 sentences before proceeding.

## Step 2: Review

If the user specified a **review angle** (e.g. "security", "conventions", "completeness
of the refactoring"), focus the review on the matching checklist(s) below and skip
the others.

If **no specific angle** was given, do a general review focusing on correctness and
anything that stands out, but don't exhaustively run every checklist. Use your judgement
to flag what matters.

For a **thorough review** covering all checklists, tell the user to use the
`@agent-review` subagent instead.

### Checklist: Correctness

- Does the code do what the stated intent says it should?
- Are there logic errors, off-by-one mistakes, or missing edge cases?
- If this is a refactoring, are **all** call sites updated? Search the codebase for
  usages of any renamed/moved/changed functions, types, or components.
- Are there any regressions — existing behavior that was accidentally broken?

### Checklist: Conventions

Read the relevant convention files before checking:

- **Frontend** (`src/client/**`): Read `src/client/coding-conventions.md` and check
  against it. Mantine components, style props, size tokens, CSS modules.
- **Backend** (`src/server/**`): Read `src/server/coding-conventions.md`. Validated router
  pattern, pg-promise parameterized queries, typed errors, Pino logging.
- **Shared** (`src/shared/**`): Zod schemas with derived types, Money for monetary
  values, branded date types (ISODate, ISOMonth, ISOTimestamp), no JS Date.
- **General**: Import ordering, no `any` types, no floating-point money, no raw SQL
  string interpolation.

### Checklist: Security

- Is user/client input validated with Zod schemas before use?
- Are API endpoints using `createValidatingRouter` with proper schemas?
- No SQL injection (all queries use `$/param/` parameterized syntax)?
- No XSS vectors (unsanitized user content rendered in React)?
- No secrets or credentials in the diff?
- No overly permissive error messages that leak internal details?
- Are authorization checks in place where needed?

### Checklist: Completeness

- If a new API endpoint was added, is there a corresponding client method in
  `ApiConnect.ts`?
- If a new type/schema was added, is it used consistently everywhere it should be?
- If a migration was added, does it handle both up and down?
- Are there any TODO or FIXME comments left in the diff that should be resolved?
- If the change touches shared types, do all consumers still work?

### Checklist: Quality

- Unnecessary complexity or over-engineering?
- Dead code or unused imports introduced?
- Copy-paste duplication that should be extracted?
- Misleading variable or function names?
- Missing error handling at system boundaries?

## Step 3: Present Findings

State the **review scope** and **intent**, then list findings sorted by priority:

1. **Bugs** — incorrect behavior, logic errors, regressions
2. **Security** — validation gaps, injection risks, auth issues
3. **Completeness** — missed call sites, missing validations, incomplete migrations
4. **Convention violations** — deviations from project coding standards
5. **Code quality** — style, naming, unnecessary complexity

Number each finding sequentially so the user can reference them (e.g. "fix 2 and 5,
leave 3 as-is"). Format:

```
#1
[PRIORITY] Bug | Security | Completeness | Convention | Quality
[FILE] path/to/file.ts:line
[ISSUE] Clear description of the problem
[SUGGESTION] How to fix it (be specific)
```

End with a summary count and overall assessment.

## Rules

- Do not make any changes to the code — this is a review, not a fix.
- Read full files for context, not just diffs.
- Be specific — cite file paths and line numbers.
- If you are unsure whether something is an issue, flag it with a note about your
  uncertainty rather than silently skipping it.
- Do not nitpick formatting — `bun format` handles that.
