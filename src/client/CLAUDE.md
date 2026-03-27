# Frontend: Mantine 8 UI Framework

**The codebase is being migrated from MUI/Emotion to Mantine 8.** Much of the existing
UI code still uses the old stack (Emotion `styled`, MUI components, custom CSS). This
old code is legacy — do NOT use it as an example for new code.

## Rules for new and modified UI code

1. **Use Mantine components** (`Text`, `Group`, `Stack`, `Box`, `ActionIcon`, `Button`,
   `Paper`, `Container`, `ScrollArea`, `AppShell`, `Table`, `NavLink`, etc.) instead of
   raw HTML elements or custom styled wrappers.
2. **Use Mantine style props** (`p`, `m`, `fz`, `fw`, `c`, `bg`, `w`, `h`, etc.) for
   simple styling. These go directly on Mantine components. **Use Mantine size tokens**
   (`"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`) instead of raw pixel values for spacing,
   padding, margins, and gaps — e.g. `p="sm"` not `p={8}`, `gap="md"` not `gap={16}`.
   Pick the size token closest to the original value.
3. **Use Mantine `style` prop** for one-off CSS properties not covered by style props.
4. **Only use custom CSS (Emotion `styled` or CSS files) when clearly required** — for
   example, complex pseudo-elements or CSS patterns like diagonal stripes that have no
   Mantine equivalent.
5. **Do NOT create new Emotion `styled` wrappers** for things Mantine handles natively
   (padding, margins, colors, font sizes, flex layout, visibility, etc.).
6. **Do NOT wrap Mantine components with `styled()`** — Emotion's `styled()` does not
   forward Mantine's polymorphic props correctly. Use `styled.div` / `styled.span` if
   you must use Emotion, or prefer Mantine's `style`/`styles` props.
7. **Proactively rewrite legacy components.** When working on any UI component, rewrite
   it from scratch using Mantine if it uses old patterns (Emotion `styled` wrappers,
   hardcoded pixel sizes, fixed heights, manual CSS hacks). Don't try to patch old code —
   think about how you'd build it fresh with Mantine and do that instead. Convert class
   components to functional components with hooks at the same time.
8. **Use Mantine component props, not CSS overrides.** For example, use `withRowBorders`,
   `withTableBorder`, `bg`, `gap` etc. instead of fighting component CSS with custom
   selectors or CSS variable overrides.

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
- **Breakpoints**: Uses Mantine defaults (xs=576, sm=768, md=992, lg=1200, xl=1408).
  `sm` is the primary mobile/desktop boundary, `xs` is portrait phone. Use `visibleFrom`/
  `hiddenFrom` props for responsive visibility, `useIsMobile()` / `useIsMobilePortrait()`
  hooks from `client/ui/hooks/useBreakpoints` for conditional rendering.
- **Spacing**: Mantine default spacing scale (xs=10, sm=12, md=16, lg=20, xl=32).
  Always prefer size tokens over raw pixels.
- **Icons**: Lucide React (`lucide-react`). Wrapped in `src/client/ui/icons/Icons.tsx`
  with a name→component map (`LucideIcons`). Use `<Icons.Name />` or
  `<RenderIcon icon="Name" />`. Add new icons by importing from `lucide-react` and
  adding to the map.

## State & Data

- **API calls**: `apiConnect` singleton (`client/data/ApiConnect.ts`)
- **Async loading**: `useAsyncData(loader, enabled, ...deps)` hook
- **State**: Zustand (preferred for new code), Bacon.js reactive streams (legacy)
- **Dialogs**: `UserPrompts.confirm()`, `UserPrompts.promptText()`
