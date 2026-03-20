/**
 * Semantic color constants for the app.
 *
 * All values reference Mantine CSS variables so they stay in sync with the theme.
 * The Mantine theme (mantineTheme.ts) defines:
 *   - `primary` → cyan (virtualColor alias)
 *   - `neutral` → gray (virtualColor alias)
 *
 * Usage in styled components:
 *   background-color: ${colors.surface};
 *   color: ${colors.primary[7]};
 *
 * Usage in Mantine component props:
 *   <Button color="primary">   (uses primaryColor from theme)
 *
 * To change the app's color scheme, edit mantineTheme.ts.
 */
import { DEFAULT_THEME } from '@mantine/core';

const c = DEFAULT_THEME.colors;

// --- Mantine CSS variable helpers ---
// Use these in Emotion styled templates for theme-synchronized colors.

/** Primary accent color scale (cyan via virtualColor) */
export const primary = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i, `var(--mantine-color-primary-${i})`]),
) as Record<number, string>;

/** Neutral color scale (gray via virtualColor) */
export const neutral = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i, `var(--mantine-color-neutral-${i})`]),
) as Record<number, string>;

// --- Semantic color tokens (CSS vars) ---

export const surface = 'var(--mantine-color-body)';
export const text = 'var(--mantine-color-text)';

// --- Semantic colors ---
// Use light-dark() CSS function for colors that need different light/dark values.

export const positive = `light-dark(${c.dark[9]}, ${c.green[4]})`;
export const negative = `light-dark(${c.red[7]}, ${c.red[4]})`;
export const unimportant = 'var(--mantine-color-dimmed)';
export const income = `light-dark(${c.teal[6]}, ${c.teal[4]})`;
export const unconfirmed = `light-dark(${c.yellow[1]}, ${c.yellow[9]})`;

export const action = primary[7];
export const tool = neutral[7];
export const navigation = primary[5];
export const navigationBar = neutral[2];
export const white = 'var(--mantine-color-white)';
export const header = neutral[5];

export const topItem = primary[6];
export const subItem = neutral[5];

export const highlightBg = primary[1];
export const highlightFg = primary[7];
