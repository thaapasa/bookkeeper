---
description: Frontend coding conventions for the Mantine 8 React UI
globs:
  - src/client/**/*.ts
  - src/client/**/*.tsx
---

# Frontend: Mantine 8 Conventions

The codebase is migrating from MUI/Emotion to Mantine 8. Existing legacy code is NOT
a reference — build new code fresh with Mantine.

## Component Rules

- Use Mantine components (`Text`, `Group`, `Stack`, `Box`, `ActionIcon`, `Button`,
  `Paper`, `Container`, `ScrollArea`, `AppShell`, `Table`, `NavLink`) over raw HTML
  or custom styled wrappers.
- Use Mantine style props (`p`, `m`, `fz`, `fw`, `c`, `bg`, `w`, `h`) for simple styling.
- Use the `style` prop for one-off CSS not covered by style props.
- Only use Emotion `styled` when clearly required (pseudo-elements, custom media-query
  breakpoints from `media.mobile` / `media.mobilePortrait`, complex CSS patterns).
- Do NOT create new `styled` wrappers for things Mantine handles (padding, margins,
  colors, font sizes, flex layout).
- Do NOT wrap Mantine components with `styled()` — it breaks polymorphic props.
  Use `styled.div` / `styled.span` if Emotion is needed.

## Rewrite Legacy Code When Touching Files

When modifying a component that uses old patterns, rewrite it from scratch with Mantine.
Don't patch Emotion wrappers or MUI remnants — think about how you'd build it fresh.
Convert class components to functional components at the same time.

## Legacy Patterns (Do NOT Copy)

- `import styled from '@emotion/styled'` with simple layout wrappers
- `import { ... } from '@mui/material'` (MUI imports)
- Custom `VCenterRow`, `Flex` from `GlobalStyles.ts` — use Mantine `Group` / `Flex`
- `PageContentContainer` — deleted, use `ScrollArea`
- Inline style objects for margins/padding — use Mantine style props

## Theme & Layout

- Theme: `src/client/ui/theme/mantineTheme.ts` — custom colors (`primary`, `neutral`,
  `action`, `income`), dark mode via virtualColor
- Font sizes: xs=10, sm=12, md=14, lg=16, xl=18. Use `md` for normal text, `sm` for
  dense tables, `xs` for minor labels.
- Layout: `BookkeeperPage.tsx` — `AppShell` + `Container`
- Custom breakpoints: `media.mobile` (< 840px), `media.mobilePortrait` (< 600px) from
  `client/ui/Styles` — these don't match Mantine's built-in breakpoints.
- Icons: Lucide React via `src/client/ui/icons/Icons.tsx`. Use `<Icons.Name />` or
  `<RenderIcon icon="Name" />`.

## State & Data

- API calls: `apiConnect` singleton from `client/data/ApiConnect.ts`
- Async loading: `useAsyncData(loader, enabled, ...deps)` hook
- State: Zustand (preferred for new code), Bacon.js reactive streams (legacy — migrate away)
- Dialogs: `UserPrompts.confirm()`, `UserPrompts.promptText()`
