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

import { Money, MoneyLike } from 'shared/util';

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

export const surface = 'var(--mantine-color-white)';
export const text = 'var(--mantine-color-text)';

// --- Semantic colors (static values for non-CSS-var contexts like SVG fill) ---

export const positive = c.dark[9];
export const negative = c.red[7];
export const unimportant = c.gray[5];
export const income = c.teal[5];
export const unconfirmed = c.yellow[1];

// --- Legacy compatibility layer ---
// These re-export semantic names used by 50+ files.
// Prefer primary[n] / neutral[n] / CSS vars in new code.

interface ColorDef {
  standard: string;
  light: string;
  dark: string;
  text: string;
}

interface ColorScheme {
  primary: ColorDef;
  secondary: ColorDef;
  gray: ColorDef & { veryDark: string };
  text: string;
  white: string;
}

export const gray = {
  light: neutral[1],
  standard: neutral[3],
  dark: neutral[5],
  veryDark: neutral[7],
  text: text,
};

export const primaryColors: ColorDef = {
  light: neutral[1],
  standard: neutral[2],
  dark: neutral[4],
  text: text,
};

export const secondaryColors: ColorDef = {
  light: primary[2],
  standard: primary[5],
  dark: primary[7],
  text: primary[9],
};

export const colorScheme: ColorScheme = {
  primary: primaryColors,
  secondary: secondaryColors,
  gray,
  text: text,
  white: surface,
};

export const action = primary[7];
export const tool = neutral[7];
export const navigation = primary[5];
export const navigationBar = neutral[2];
export const white = '#ffffff';
export const header = neutral[5];

export const topItem = primary[6];
export const subItem = neutral[5];

export const highlightBg = primary[1];
export const highlightFg = primary[7];

// --- Utility functions ---

export function diagonalStripes(
  color1: string,
  color2: string,
  width1: string,
  width2: string,
): string {
  return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}

export const unconfirmedStripes = diagonalStripes(unconfirmed, white, '0.5em', '1em');

export function forMoney(m?: MoneyLike): string {
  if (!m) {
    return unimportant;
  }
  const b = Money.from(m);
  return b ? (b.gt(0) ? positive : b.lt(0) ? negative : unimportant) : unimportant;
}

export function classNameForMoney(m?: MoneyLike): 'positive' | 'negative' | 'unimportant' {
  if (!m) {
    return 'unimportant';
  }
  const b = Money.from(m);
  return b ? (b.gt(0) ? 'positive' : b.lt(0) ? 'negative' : 'unimportant') : 'unimportant';
}

export function getLuminanceSafe(color: string): number {
  try {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return 0;
  }
}
