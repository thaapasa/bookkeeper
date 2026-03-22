---
name: frontend
description: Frontend specialist for the Mantine 8 React UI (src/client/)
---

# Frontend: Mantine 8 UI Framework

**The codebase is being migrated from MUI/Emotion to Mantine 8.** Much of the existing
UI code still uses the old stack (Emotion `styled`, MUI components, custom CSS). This
old code is legacy — do NOT use it as an example for new code.

## Rules for new and modified UI code

1. **Use Mantine components** (`Text`, `Group`, `Stack`, `Box`, `ActionIcon`, `Button`,
   `Paper`, `Container`, `ScrollArea`, `AppShell`, `Table`, `NavLink`, etc.) instead of
   raw HTML elements or custom styled wrappers.
2. **Use Mantine style props** (`p`, `m`, `fz`, `fw`, `c`, `bg`, `w`, `h`, etc.) for
   simple styling. These go directly on Mantine components.
3. **Use Mantine `style` prop** for one-off CSS properties not covered by style props.
4. **Only use custom CSS (Emotion `styled` or CSS files) when clearly required** — for
   example, complex pseudo-elements, the app's custom media-query breakpoints
   (`media.mobile`, `media.mobilePortrait`), or CSS patterns like diagonal stripes that
   have no Mantine equivalent.
5. **Do NOT create new Emotion `styled` wrappers** for things Mantine handles natively
   (padding, margins, colors, font sizes, flex layout, visibility, etc.).
6. **Do NOT wrap Mantine components with `styled()`** — Emotion's `styled()` does not
   forward Mantine's polymorphic props correctly. Use `styled.div` / `styled.span` if
   you must use Emotion, or prefer Mantine's `style`/`styles` props.
7. **Replace legacy patterns when touching a file.** If you're modifying a component that
   uses `styled` for simple layout, convert those parts to Mantine as part of the change.

## Code Quality: Be Proactive

When working on any file, **actively look for bad code** in that file and nearby code.
Legacy patterns (Emotion `styled` for simple layout, MUI imports, class components,
Bacon.js streams), wrong idioms, code smells, and missing best practices should all be
flagged. Fix issues that are in scope; for out-of-scope issues, always ask whether to
include the fix. No bad code should go unmentioned.

## What "legacy code" looks like (don't copy these patterns)

- `import styled from '@emotion/styled'` with simple layout wrappers
- `import { Button, Box } from '@mui/material'` (MUI imports)
- Custom `VCenterRow`, `Flex` from `GlobalStyles.ts` — use Mantine `Group` / `Flex`
- `PageContentContainer` — deleted, use `ScrollArea`
- Inline style objects for margins/padding — use Mantine style props

## Mantine reference

- **Theme**: `src/client/ui/theme/mantineTheme.ts` — custom colors (`primary`, `neutral`,
  `action`, `income`), dark mode via virtualColor
- **Font sizes**: Smaller than Mantine defaults (xs=10, sm=12, md=14, lg=16, xl=18).
  Use `md` for normal UI text, `sm` for dense data tables, `xs` for minor labels.
- **Layout**: `BookkeeperPage.tsx` — `AppShell` + `Container` (no card wrapper)
- **Custom breakpoints**: The app uses `media.mobile` (< 840px) and `media.mobilePortrait`
  (< 600px) from `client/ui/Styles`. These do NOT match Mantine's built-in breakpoints,
  so use Emotion `styled` + `media.*` for responsive hiding at these thresholds.
- **Icons**: Lucide React (`lucide-react`). Wrapped in `src/client/ui/icons/Icons.tsx`
  with a name→component map (`LucideIcons`). Use `<Icons.Name />` or
  `<RenderIcon icon="Name" />`. Add new icons by importing from `lucide-react` and
  adding to the map.

## State & Data

- **API calls**: `apiConnect` singleton (`client/data/ApiConnect.ts`)
- **Async loading**: `useAsyncData(loader, enabled, ...deps)` hook
- **State**: Zustand (preferred for new code), Bacon.js reactive streams (legacy)
- **Dialogs**: `UserPrompts.confirm()`, `UserPrompts.promptText()`
