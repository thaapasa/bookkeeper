# UI Modernization: Replacing Material UI

## Current State Analysis

### MUI Integration Depth
- **142 TSX components** total, **99 files (49%)** import MUI
- **235 `styled()` instances** (mix of `@mui/material` and `@emotion/styled`)
- **47 MUI icons** (centralized in `Icons.tsx`)
- **No MUI ThemeProvider** — custom color system in `Colors.ts`
- **Custom responsive breakpoints** in `Styles.ts` (not MUI's)
- **Custom table implementation** (no MUI DataGrid)

### MUI Components Used (by frequency)
| Component                          | Files         | Replacement Difficulty            |
|------------------------------------|---------------|-----------------------------------|
| `styled()`                         | 235 instances | Depends on CSS strategy           |
| Button                             | 28            | Easy — simple component           |
| Grid                               | 18            | Easy — CSS Grid/Flexbox           |
| IconButton                         | 17            | Easy — styled button + icon       |
| Dialog/DialogTitle/Content/Actions | 12            | Medium — need accessible overlay  |
| FormControl/InputLabel             | 7             | Medium — custom form styling      |
| Chip                               | 6             | Easy — styled span                |
| Checkbox/FormControlLabel          | 5             | Medium — need accessible toggle   |
| CircularProgress                   | 4             | Easy — CSS animation              |
| TextField                          | 3             | Medium — need validation styling  |
| DatePicker (@mui/x)                | 3             | Hard — complex component          |
| Select/MenuItem                    | 2             | Medium — need accessible dropdown |
| Avatar                             | 2             | Easy — styled img                 |
| AppBar/Toolbar/Drawer              | 1-2           | Medium — layout components        |
| Typography                         | 3             | Easy — styled text                |
| Alert                              | 2             | Easy — styled div                 |

### Styling Architecture (what we're keeping/changing)
- **Emotion** is used directly in ~20 files (`@emotion/styled`)
- **MUI's styled** (wraps Emotion) used in ~55+ files
- **Custom media query helpers** (`media.mobile`, `media.web`) — independent of MUI
- **Custom color system** (`Colors.ts`) — portable, not theme-dependent
- **1 global CSS file** (`bookkeeper.css`) — minimal reset
- **`sx` prop** used in only 7 places — easy to remove

### What's NOT deeply coupled to MUI
✅ Color system (custom `Colors.ts`)
✅ Responsive breakpoints (custom `Styles.ts`)
✅ Table/list rendering (custom components)
✅ Layout utilities (`VCenterRow`, `Flex`, etc.)
✅ Form validation (manual, no MUI form lib)
✅ State management (Zustand + BaconJS)
✅ Routing (React Router)
✅ Charts (Recharts)

---

## Alternatives

### Option A: Radix UI + Emotion (Keep Current Styling)
**Philosophy:** Swap MUI components for Radix headless primitives, keep the `styled()` tagged template pattern you already like.

**Components:**
- Radix UI primitives for Dialog, Select, Checkbox, Popover, Tooltip, etc.
- Custom styled buttons (replace MUI Button)
- CSS Grid/Flexbox (replace MUI Grid)
- Lucide React icons (replace @mui/icons-material — 47 icons to map)
- react-day-picker or custom date picker (replace @mui/x-date-pickers)

**Pros:**
- ✅ **Minimal authoring change** — keep `styled()` tagged templates
- ✅ Excellent accessibility (Radix is WAI-ARIA compliant)
- ✅ Much smaller bundle (~3-5 KB/component vs MUI's heavier footprint)
- ✅ Full design control — no fighting MUI's opinionated styles
- ✅ Incremental migration possible (Radix + MUI can coexist)

**Cons:**
- ⚠️ Still has Emotion runtime overhead (style injection at runtime)
- ⚠️ Need to design/style every Radix primitive yourself
- ⚠️ Date picker replacement needs evaluation

**Migration effort:** MODERATE
**Performance improvement:** MODERATE (smaller JS bundle, but still runtime CSS)
**Styling familiarity:** ★★★★★ (identical to current)

---

### Option B: Radix UI + Tailwind CSS
**Philosophy:** Headless Radix primitives styled with Tailwind utility classes. The most popular modern React UI approach.

**Components:**
- Same Radix primitives as Option A
- Tailwind CSS for all styling (replaces Emotion entirely)
- Lucide React icons
- Could adopt shadcn/ui patterns (copy-paste Radix+Tailwind components)

**Pros:**
- ✅ **Zero runtime CSS** — best possible performance
- ✅ Enormous ecosystem and community (shadcn/ui, etc.)
- ✅ Consistent design through Tailwind's design system
- ✅ Tiny CSS output (JIT compiler generates only used classes)
- ✅ shadcn/ui provides pre-built Radix+Tailwind components to start from

**Cons:**
- ❌ **Major paradigm shift** — utility classes vs CSS-in-JS tagged templates
- ❌ All 235 styled() instances need rewriting
- ❌ Verbose className strings in JSX
- ❌ Different mental model for responsive design
- ❌ Larger migration effort

**Migration effort:** HIGH
**Performance improvement:** HIGH (zero runtime CSS, smallest bundle)
**Styling familiarity:** ★★☆☆☆ (very different from current)

---

### Option C: Radix UI + Panda CSS
**Philosophy:** Zero-runtime CSS-in-JS that feels similar to styled-components. Best of both worlds — familiar authoring + build-time extraction.

**Components:**
- Same Radix primitives as Options A/B
- Panda CSS for styling (similar API to Emotion but zero-runtime)
- Lucide React icons + react-day-picker

**Panda CSS styled example:**
```tsx
import { styled } from '../styled-system/jsx';

const Container = styled('div', {
  base: {
    padding: '16px',
    display: 'flex',
  },
});
```

**Pros:**
- ✅ **Zero runtime** — styles extracted at build time
- ✅ Familiar mental model (styled components, but with object syntax)
- ✅ Type-safe style properties
- ✅ Built-in design token system (colors, spacing, breakpoints)
- ✅ Variant support built-in (great for component states)

**Cons:**
- ⚠️ Object syntax instead of tagged template strings (style change)
- ⚠️ Newer library, smaller ecosystem than Tailwind
- ⚠️ Build step adds complexity
- ⚠️ 2-3x slower render than Tailwind in dynamic cases (but still much faster than Emotion)
- ⚠️ Need to learn Panda's token/recipe system

**Migration effort:** MODERATE-HIGH
**Performance improvement:** HIGH (zero runtime, build-time CSS)
**Styling familiarity:** ★★★☆☆ (similar concept, different syntax)

---

### Option D: Mantine
**Philosophy:** Full component library swap — Mantine is a lighter, more modern alternative to MUI with similar breadth. **You already have deep Mantine experience from work**, which dramatically reduces migration risk and effort.

**Components:**
- Mantine components (Button, Modal, Select, Checkbox, DatePicker, etc.)
- Mantine's CSS Modules styling (default in Mantine v7)
- Mantine hooks (useDisclosure, useForm, etc.)
- Can keep some Emotion for custom components, or migrate to Mantine's styling

**Pros:**
- ✅ **Fastest migration by far** — you already know the API, no learning curve
- ✅ Nearly 1:1 component mapping from MUI → Mantine
- ✅ Includes DatePicker (solves the date picker replacement problem cleanly)
- ✅ ~60-180 KB with tree-shaking (lighter than MUI)
- ✅ Excellent TypeScript support and documentation
- ✅ Active community and rapid development
- ✅ Built-in notifications, modals, hooks — you know what's available
- ✅ Mantine v7 CSS Modules = zero CSS-in-JS runtime (performance win)
- ✅ Can leverage your work experience to make fast decisions

**Cons:**
- ⚠️ Still a full component library — if MUI feels "overkill", Mantine might too (though it's leaner)
- ⚠️ CSS Modules is the default styling in v7 (different from current Emotion tagged templates)
- ⚠️ Introduces Mantine's design language (but you're already familiar with customizing it)
- ⚠️ Similar vendor lock-in pattern to MUI

**Migration effort:** LOW (your Mantine expertise makes this the easiest path)
**Performance improvement:** MODERATE-HIGH (CSS Modules = zero runtime CSS for Mantine components)
**Styling familiarity:** ★★★★☆ (you already know Mantine well)

---

## Comparison Matrix

| Criteria              | A: Radix+Emotion | B: Radix+Tailwind | C: Radix+Panda | D: Mantine |
|-----------------------|:----------------:|:-----------------:|:--------------:|:----------:|
| Migration effort      |      ★★★☆☆       |       ★★☆☆☆       |     ★★★☆☆      |   ★★★★★    |
| Performance gain      |      ★★★☆☆       |       ★★★★★       |     ★★★★☆      |   ★★★★☆    |
| Styling familiarity   |      ★★★★★       |       ★★☆☆☆       |     ★★★☆☆      |   ★★★★☆    |
| Bundle size reduction |      ★★★☆☆       |       ★★★★★       |     ★★★★☆      |   ★★★★☆    |
| Design flexibility    |      ★★★★★       |       ★★★★☆       |     ★★★★☆      |   ★★★☆☆    |
| Ecosystem/community   |      ★★★★☆       |       ★★★★★       |     ★★★☆☆      |   ★★★★☆    |
| Future-proofness      |      ★★★☆☆       |       ★★★★★       |     ★★★★☆      |   ★★★★☆    |
| Your prior experience |      ☆☆☆☆☆       |       ☆☆☆☆☆       |     ☆☆☆☆☆      |   ★★★★★    |

(★ = low/poor, ★★★★★ = high/excellent)

---

## Shared Decisions (Any Option)

### Icon Replacement
Replace `@mui/icons-material` (47 icons) with **Lucide React**:
- Lighter (~1 KB per icon vs MUI's heavier bundle)
- Clean, modern design
- 1,500+ icons, covers all 47 currently used
- Tree-shakeable individual imports

### Date Picker Replacement
Replace `@mui/x-date-pickers` with one of:
- **react-day-picker** — lightweight, accessible, Luxon-compatible
- **Custom Radix Popover + calendar grid** — most control, more work
- Native `<input type="date">` — simplest but limited styling

### Grid Replacement
Replace MUI Grid (18 files) with:
- CSS Grid (`display: grid`) — already natural with styled components
- Flexbox — already used extensively in the codebase
- Both are simpler and more performant than MUI's Grid abstraction

---

## Recommendation: Mantine (Option D)

### Is Mantine "overkill" for this app?
**No.** Mantine v7 is significantly leaner than MUI:
- Tree-shakes well — you only ship the components you import
- CSS Modules (not runtime CSS-in-JS) — no style injection overhead
- Simpler component trees — fewer wrapper divs than MUI
- No global theme runtime — CSS variables handled via static CSS

Your app uses ~15 distinct component types (Button, Dialog, Select, Checkbox, DatePicker, etc.). Mantine covers all of these without being heavier than the alternative of assembling Radix + separate date picker + icon library + custom form inputs. For a personal app, avoiding the assembly work of a headless approach saves significant effort.

### Making it NOT look "Mantine"
Mantine v7 is highly customizable via `createTheme()` and CSS variables. Here's how your current design maps:

```tsx
import { createTheme } from '@mantine/core';

const theme = createTheme({
  // Match your current warm brown/orange palette
  colors: {
    primary: ['#ffffff', '#f5f5f6', '#efebe9', '#e3dfdd', '#bdb9b7', ...],
    secondary: ['#ffbb93', '#ff8a65', '#c75b39', ...],
  },
  primaryColor: 'primary',
  fontFamily: 'Roboto, sans-serif',

  // Override component defaults globally
  components: {
    Button: { defaultProps: { variant: 'subtle', radius: 'sm' } },
    Modal: { defaultProps: { radius: 'sm' } },
  },
});
```

Key customization tools:
- **`createTheme()`** — global colors, fonts, radius, spacing
- **Styles API** — override any internal element of any component via `classNames` prop
- **CSS variables** — `--mantine-color-*`, `--mantine-radius-*`, etc.
- **`unstyled` prop** — strip ALL Mantine styles from a component, style from scratch
- **Custom variants** — define your own visual variants per component

Your current color scheme (warm browns, orange-red accents, teal/lime highlights) maps directly to a Mantine theme. The result looks like *your app*, not "a Mantine app."

### Hybrid styling approach
- **Mantine components** for interactive primitives (Button, Modal, Select, Checkbox, DatePicker)
- **Keep `styled()` with Emotion** for custom layouts, expense rows, containers
- Mantine and Emotion coexist — Mantine uses CSS Modules, not Emotion
- Gradually migrate custom `styled()` to CSS Modules if desired (or keep — it works fine)

### Why the sluggishness goes away
MUI's performance issues come from:
1. **Heavy component trees** — each MUI Button renders ~5-7 DOM nodes; Mantine renders 1-2
2. **Runtime style injection** — MUI uses Emotion at runtime for theme resolution; Mantine uses static CSS
3. **Theme context overhead** — MUI reads theme context on every render; Mantine uses CSS variables

---

## Migration Strategy

The migration is done incrementally. Mantine and MUI can coexist during transition.

### Phase 1: Foundation Setup
- Install Mantine packages (`@mantine/core`, `@mantine/hooks`, `@mantine/dates`)
- Set up `MantineProvider` with custom theme matching current colors/fonts
- Replace MUI icons with Tabler Icons (Mantine's default icon set) or Lucide React
- Switch `styled` imports from `@mui/material` to `@emotion/styled` (decouple from MUI)
- Replace MUI Grid (18 files) with CSS Grid/Flexbox
- Import Mantine CSS in entry point

### Phase 2: Simple Components
- Replace MUI Button → Mantine Button (28 files)
- Replace MUI IconButton → Mantine ActionIcon (17 files)
- Replace Typography → styled text or Mantine Text/Title
- Replace Avatar, Chip, Alert, CircularProgress, Divider → Mantine equivalents
- Replace AppBar/Toolbar → custom styled header (or Mantine AppShell)
- Replace Drawer → Mantine Drawer

### Phase 3: Interactive Components
- Replace MUI Dialog → Mantine Modal (12 files)
- Replace MUI Select/MenuItem → Mantine Select (2 files)
- Replace MUI Checkbox/FormControlLabel → Mantine Checkbox (5 files)
- Replace MUI TextField → Mantine TextInput (3 files)
- Replace FormControl/InputLabel → Mantine Input.Wrapper

### Phase 4: Complex Components & Cleanup
- Replace MUI DatePicker → Mantine DatePicker from `@mantine/dates` (3 files)
- Update Colors.ts: remove MUI color imports, use CSS variables or keep as constants
- Remove all `@mui/*` packages from package.json
- Remove `@emotion/react` and `@emotion/styled` if fully migrated (or keep for custom styling)
- Clean up unused styles and imports
- Performance testing
