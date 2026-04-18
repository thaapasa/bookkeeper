import {
  createTheme,
  CSSVariablesResolver,
  DEFAULT_THEME,
  MantineColorsTuple,
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

// Reverse the dark scale so low indices = dark (backgrounds) and high = light (text)
const darkReversed = [...DEFAULT_THEME.colors.dark].reverse() as unknown as MantineColorsTuple;

const surfaceLight: MantineColorsTuple = [
  '#faf7ef',
  '#f3efe2',
  '#ece5d2',
  '#dcd2b9',
  '#c7b896',
  '#a89872',
  '#8a7b58',
  '#6e6343',
  '#524a31',
  '#3a3321',
];

const surfaceDark: MantineColorsTuple = [
  '#38322a',
  '#2f2a23',
  '#22201c',
  '#4b4238',
  '#5c5347',
  '#766a56',
  '#968a72',
  '#b5a98d',
  '#d0c5a8',
  '#ebdfc2',
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

export const mantineTheme = createTheme({
  primaryColor: 'primary',
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
  /** Mantine default breakpoints, written explicitly for reference */
  breakpoints: {
    xs: '36em', // 576px
    sm: '48em', // 768px
    md: '62em', // 992px
    lg: '75em', // 1200px
    xl: '88em', // 1408px
  },
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
