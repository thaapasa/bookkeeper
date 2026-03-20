import { createTheme } from '@mantine/core';

/**
 * Uses Mantine's default font size scale:
 *   xs  = 0.75rem  (12px) — small labels, version info, badges
 *   sm  = 0.875rem (14px) — compact/dense text, table cells
 *   md  = 1rem     (16px) — default body text (global default)
 *   lg  = 1.125rem (18px) — emphasized text, large titles
 *   xl  = 1.25rem  (20px) — extra large text
 *
 * Uses Mantine's built-in color palette (no custom color scales).
 * All colors referenced via theme: color="cyan", var(--mantine-color-cyan-5), etc.
 * Primary color: cyan. See Colors.ts for semantic color mapping.
 */

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

export const mantineTheme = createTheme({
  primaryColor: 'cyan',
  fontFamily: "'Inter', sans-serif",
  headings,
  defaultRadius: 'sm',
});
