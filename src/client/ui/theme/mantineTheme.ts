import {
  createTheme,
  CSSVariablesResolver,
  DEFAULT_THEME,
  defaultVariantColorsResolver,
  MantineColorsTuple,
  parseThemeColor,
  VariantColorsResolver,
  virtualColor,
} from '@mantine/core';

/**
 * Mantine theme configuration.
 *
 * Uses Mantine's built-in color palette with semantic virtualColor aliases:
 *   - `primary` → cyan (interactive elements, buttons, links, accent)
 *   - `neutral` → gray in light mode, reversed dark scale in dark mode
 *   - `surface` → warm beige chrome tones (app shell, cards, sticky footers)
 *
 * The dark scale is reversed so that index semantics match:
 *   neutral[0-2] = subtle backgrounds (light greys / dark surfaces)
 *   neutral[3-5] = borders, dividers
 *   neutral[7-9] = text, strong contrast
 *
 * `surface` follows the same index semantics, with non-monotonic backgrounds
 * so the "floating card" effect holds in both modes:
 *   surface[0] = card / elevated container background
 *   surface[1] = subtle contrast (sticky footer, alternating rows)
 *   surface[2] = body background (sits behind the card)
 *   surface[3-4] = soft borders
 *   surface[7-9] = warm text tones
 *
 * Components use: color="primary", var(--mantine-color-primary-5), etc.
 * To change the app's accent color, just change the `light`/`dark` targets below.
 *
 * Font sizes (smaller than Mantine defaults for compact UI):
 *   xs=10px, sm=12px, md=14px, lg=16px, xl=18px
 */

/**
 * Mantine breakpoints in `em` (the unit Mantine itself uses). JS code
 * that needs a pixel threshold must multiply by the *current* root
 * font-size — at small viewports `coding-conventions.md` bumps the
 * root to 18px, so a static px constant would disagree with the same
 * breakpoints when used in `@media` / `@container` queries. The same
 * values are also wired into postcss-preset-mantine's config; that
 * duplication is unavoidable as long as postcss vars are resolved at
 * build time.
 */
export const breakpointEm = {
  xs: 36,
  sm: 48,
  md: 62,
  lg: 75,
  xl: 88,
} as const;

/**
 * Resolve a Mantine breakpoint to pixels using the root font-size, so
 * the result always matches what an `@media` / `@container` query with
 * the same breakpoint would compute right now. The root font-size only
 * changes on viewport resize (coding-conventions.md bumps the root via
 * media query at small viewports), so we cache it across calls and
 * invalidate on `resize` — `getComputedStyle` is otherwise called inside
 * ResizeObserver callbacks once per frame.
 */
let cachedRootPx: number | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    cachedRootPx = null;
  });
}

export function breakpointPx(name: keyof typeof breakpointEm): number {
  if (cachedRootPx === null) {
    cachedRootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  }
  return breakpointEm[name] * cachedRootPx;
}

// Reverse the dark scale so low indices = dark (backgrounds) and high = light (text)
const darkReversed = [...DEFAULT_THEME.colors.dark].reverse() as unknown as MantineColorsTuple;

const surfaceLight: MantineColorsTuple = [
  '#fdfcf8',
  '#f6f3ec',
  '#eeebe1',
  '#e0dccf',
  '#c7c2af',
  '#a6a089',
  '#858069',
  '#65614e',
  '#4a4639',
  '#322f27',
];

const surfaceDark: MantineColorsTuple = [
  '#32302b',
  '#282724',
  '#1c1b18',
  '#44423c',
  '#55534b',
  '#6e6c61',
  '#8a8779',
  '#a8a494',
  '#c6c1ae',
  '#e0dbc7',
];

const headings = {
  fontFamily: "'Oswald', sans-serif",
  fontWeight: '300',
  sizes: {
    h1: { fontSize: '2.125rem', lineHeight: '1.2' },
    h2: { fontSize: '1.5rem', lineHeight: '1.3' },
    h3: { fontSize: '1.25rem', lineHeight: '1.3' },
    h4: { fontSize: '1.125rem', lineHeight: '1.4' },
    h5: { fontSize: '1rem', lineHeight: '1.4' },
    h6: { fontSize: '0.875rem', lineHeight: '1.4' },
  },
};

/**
 * Override Mantine's variant resolution for `color="neutral"`.
 *
 * Mantine's index-based shade picker (`color[6]` for filled in light, `color[8]` in dark)
 * doesn't fit a gray scale: gray[6] is too heavy against a near-white page, gray[0] (used
 * by `light`) is invisible against it, and our reversed dark scale makes `darkReversed[8]`
 * a *light* shade — white text on it has ~1.4:1 contrast, which is unreadable.
 *
 * For `color="neutral"` we substitute mode-aware values so filled/light/outline/subtle
 * produce subtle chip surfaces that respect the page in both modes. Other colors fall
 * through to Mantine's default resolver.
 */
const variantColorResolver: VariantColorsResolver = input => {
  const defaults = defaultVariantColorsResolver(input);
  const parsed = parseThemeColor({
    color: input.color || input.theme.primaryColor,
    theme: input.theme,
  });
  if (parsed.color !== 'neutral') return defaults;

  // Dark-mode bg values are lifted above surface.1 (#282724) so chips stand off
  // the expense-table row bg. gray-2/3 stays subtle against light-mode pages.
  const subtleBg = 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))';
  const subtleBgHover = 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))';
  const lightBg = 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))';
  const lightBgHover = 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))';
  const fg = 'light-dark(var(--mantine-color-gray-8), var(--mantine-color-gray-1))';
  const dimFg = 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-3))';
  const borderColor = 'light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))';

  switch (input.variant) {
    case 'filled':
      return {
        ...defaults,
        background: subtleBg,
        hover: subtleBgHover,
        color: fg,
        border: 'transparent',
      };
    case 'light':
      return {
        ...defaults,
        background: lightBg,
        hover: lightBgHover,
        color: fg,
        border: 'transparent',
      };
    case 'outline':
      return {
        ...defaults,
        background: 'transparent',
        hover: lightBg,
        color: fg,
        border: `1px solid ${borderColor}`,
      };
    case 'subtle':
      // Bumped one shade above lightBg so the hover stands off white input
      // backgrounds in light mode.
      return {
        ...defaults,
        background: 'transparent',
        hover: subtleBg,
        color: dimFg,
        border: 'transparent',
      };
    default:
      return defaults;
  }
};

export const mantineTheme = createTheme({
  primaryColor: 'primary',
  variantColorResolver,
  colors: {
    primary: virtualColor({ name: 'primary', light: 'cyan', dark: 'cyan' }),
    darkReversed,
    neutral: virtualColor({ name: 'neutral', light: 'gray', dark: 'darkReversed' }),
    surfaceLight,
    surfaceDark,
    surface: virtualColor({ name: 'surface', light: 'surfaceLight', dark: 'surfaceDark' }),
  },
  fontFamily: "'Inter', sans-serif",
  fontSizes: {
    xs: '0.625rem',
    sm: '0.75rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
  },
  breakpoints: Object.fromEntries(
    Object.entries(breakpointEm).map(([k, em]) => [k, `${em}em`]),
  ) as Record<keyof typeof breakpointEm, string>,
  headings,
  defaultRadius: 'sm',
  components: {
    ActionIcon: {
      defaultProps: { variant: 'subtle' },
    },
  },
});

/** Override default hover to be slightly more visible in light mode (gray.2 instead of gray.0) */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: { '--mantine-color-default-hover': DEFAULT_THEME.colors.gray[2] },
  dark: {},
});
