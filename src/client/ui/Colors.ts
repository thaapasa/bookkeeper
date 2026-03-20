/**
 * Semantic color mapping for the app.
 *
 * All colors are derived from Mantine's built-in DEFAULT_THEME color scales.
 * The Mantine theme (mantineTheme.ts) sets primaryColor: 'cyan'.
 *
 * This file provides a semantic layer so components use meaningful names
 * (colorScheme.primary.dark, positive, negative) rather than raw color indices.
 *
 * To change the app's look, adjust the index mappings below.
 */
import { DEFAULT_THEME } from '@mantine/core';

import { Money, MoneyLike } from 'shared/util';

const c = DEFAULT_THEME.colors;

// --- Semantic color definitions ---

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
  light: c.gray[1],
  standard: c.gray[3],
  dark: c.gray[5],
  veryDark: c.gray[7],
  text: c.dark[9],
};

export const primaryColors: ColorDef = {
  light: c.gray[1],
  standard: c.gray[2],
  dark: c.gray[4],
  text: c.dark[9],
};

export const secondaryColors: ColorDef = {
  light: c.cyan[2],
  standard: c.cyan[5],
  dark: c.cyan[7],
  text: c.cyan[9],
};

export const colorScheme: ColorScheme = {
  primary: primaryColors,
  secondary: secondaryColors,
  gray,
  text: c.dark[9],
  white: '#ffffff',
};

// --- Semantic single colors ---

export const positive = c.dark[9];
export const negative = c.red[7];
export const unimportant = c.gray[5];
export const income = c.teal[5];
export const unconfirmed = c.yellow[1];

export const action = c.cyan[7];
export const tool = c.gray[7];
export const navigation = c.cyan[5];
export const navigationBar = c.gray[2];
export const white = '#ffffff';
export const header = c.gray[5];

export const topItem = c.cyan[6];
export const subItem = c.gray[5];

export const highlightBg = c.cyan[1];
export const highlightFg = c.cyan[7];

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
