import { createTheme, virtualColor } from '@mantine/core';

/**
 * Mantine theme configuration.
 *
 * Uses Mantine's built-in color palette with semantic virtualColor aliases:
 *   - `primary` → cyan (interactive elements, buttons, links, accent)
 *   - `neutral` → gray (surfaces, borders, backgrounds)
 *
 * Components use: color="primary", var(--mantine-color-primary-5), etc.
 * To change the app's accent color, just change the `light`/`dark` targets below.
 *
 * Font sizes follow Mantine defaults:
 *   xs=12px, sm=14px, md=16px, lg=18px, xl=20px
 */

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
    neutral: virtualColor({ name: 'neutral', light: 'gray', dark: 'gray' }),
  },
  fontFamily: "'Inter', sans-serif",
  headings,
  defaultRadius: 'sm',
});
