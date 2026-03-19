import { createTheme, type MantineColorsTuple } from '@mantine/core';

import type { AppPalette } from './palettes';
import { getActivePalette } from './palettes';

/**
 * Font size scale (used via var(--mantine-font-size-xx) in styled components):
 *   xs  = 0.75rem  (12px) — small labels, version info, badges
 *   sm  = 0.8125rem (13px) — compact text, table cells
 *   md  = 0.875rem (14px) — standard UI text, menu items
 *   lg  = 1rem     (16px) — emphasized text, section headers
 *   xl  = 1.125rem (18px) — subtitles, large text
 */
const fontSizes = {
  xs: '0.75rem',
  sm: '0.8125rem',
  md: '0.875rem',
  lg: '1rem',
  xl: '1.125rem',
};

/** Heading styles (Oswald font) */
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

/** Generate a Mantine theme from an app palette */
function buildMantineTheme(palette: AppPalette) {
  const neutral = [...palette.neutral] as unknown as MantineColorsTuple;
  const accent = [...palette.accent] as unknown as MantineColorsTuple;

  return createTheme({
    primaryColor: 'accent',
    colors: { neutral, accent },
    fontFamily: palette.fontFamily,
    fontSizes,
    headings,
    defaultRadius: 'sm',
  });
}

export const mantineTheme = buildMantineTheme(getActivePalette());
