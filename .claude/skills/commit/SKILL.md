---
name: commit
description: Create a git commit with a well-crafted message. Use proactively whenever the user asks to commit changes or amend a commit.
argument-hint: <optional: hint about what the commit is for>
---

# Git Commit

Create a git commit for the current changes.

## Step 1: Understand the changes

Run these in parallel:

- `git status` to see all changed and untracked files
- `git diff --cached` to see staged changes
- `git diff` to see unstaged changes
- `git log --oneline -5` to see recent commit style (for reference only)

If nothing is staged, stage the relevant changed files. Do not stage files that likely
contain secrets (`.env`, credentials, etc.) — warn the user if they ask to commit those.

## Step 2: Draft the commit message

Write a commit message following these rules:

- **Start with a capital letter.** No conventional commit prefixes (`fix:`, `feat:`,
  `docs:`, `refactor:`, etc.).
- **Use natural English.** Write it like a short sentence describing what this change
  does. Think of it as completing the phrase "This commit will..."
- **Be specific.** Name the thing that changed. "Fix date picker" is better than
  "Fix bug". "Add expense grouping API" is better than "Add new feature".
- **Keep the first line under 72 characters.**
- **Add a body** (separated by blank line) only if the change is complex enough to
  need explanation of _why_ or _how_. Most commits don't need a body.

Good examples:
- `Consolidate backend conventions into coding-conventions.md`
- `Fix month navigation skipping February in date picker`
- `Add expense grouping tags with autocomplete`
- `Tighten client API signatures from DateLike to ISODate`
- `Remove unused Bacon.js subscription from ExpenseTable`

Bad examples:
- `fix: fix bug in date picker` (has prefix, vague, redundant "fix fix")
- `Update code` (too vague)
- `refactor: various improvements` (has prefix, vague)
- `WIP` (not descriptive)

## Step 3: Commit

If the user provided `$ARGUMENTS`, use that as additional context for the message but
still follow the formatting rules above.

Always end the commit message with:

```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Use a HEREDOC to pass the message:

```bash
git commit -m "$(cat <<'EOF'
Commit message here

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

If amending (user explicitly asked to amend), use `git commit --amend` instead.

## Rules

- Never force-push after committing — let the user decide.
- Never skip hooks (`--no-verify`).
- If a pre-commit hook fails, fix the issue and create a **new** commit (do not amend
  unless the user explicitly asked to amend).
- If there are no changes to commit, say so — don't create an empty commit.
