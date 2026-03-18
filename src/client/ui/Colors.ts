import { styled } from '@mui/material/styles';

import { Money, MoneyLike } from 'shared/util';

import { getResolvedColors } from './theme/palettes';

const resolved = getResolvedColors();

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
  standard: resolved.gray.standard,
  light: resolved.gray.light,
  dark: resolved.gray.dark,
  veryDark: resolved.gray.veryDark,
  text: resolved.gray.text,
};

export const primaryColors: ColorDef = {
  standard: resolved.primary.standard,
  light: resolved.primary.light,
  dark: resolved.primary.dark,
  text: resolved.primary.text,
};

export const secondaryColors: ColorDef = {
  standard: resolved.accentColors.standard,
  light: resolved.accentColors.light,
  dark: resolved.accentColors.dark,
  text: resolved.accentColors.text,
};

export const colorScheme: ColorScheme = {
  primary: primaryColors,
  secondary: secondaryColors,
  gray,
  text: resolved.text,
  white: resolved.surface,
};

// MUI palette exports (kept for MUI compatibility during migration)
export const primaryPalette = {
  light: colorScheme.primary.light,
  dark: colorScheme.primary.dark,
  main: colorScheme.primary.standard,
  contrastText: colorScheme.primary.text,
};

export const secondaryPalette = {
  light: colorScheme.secondary.light,
  dark: colorScheme.secondary.dark,
  main: colorScheme.secondary.standard,
  contrastText: colorScheme.secondary.text,
};

export const navigation = resolved.accentColors.standard;
export const white = resolved.surface;
export const navigationBar = resolved.navBar;

export const action = resolved.accentColors.dark;

export const positive = resolved.positive;
export const negative = resolved.negative;
export const unimportant = resolved.unimportant;
export const header = resolved.gray.dark;

export const topItem = resolved.topItem;
export const subItem = resolved.subItem;

export const tool = resolved.gray.veryDark;
export const unconfirmed = resolved.unconfirmed;

export const highlightBg = resolved.highlightBg;
export const highlightFg = resolved.highlightFg;

export function diagonalStripes(
  color1: string,
  color2: string,
  width1: string,
  width2: string,
): string {
  return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}

export const unconfirmedStripes = diagonalStripes(unconfirmed, white, '0.5em', '1em');
export const income = resolved.income;

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

// This is here only so that we use styled in this file. We must reference styled here or
// else watch recompile fails with a warning "module not found" (looks like a bug)
export const unused = styled('div')`
  width: 100%;
`;

export function getLuminanceSafe(color: string): number {
  try {
    // Simple relative luminance approximation
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return 0;
  }
}
