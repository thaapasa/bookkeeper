import { amber, grey, lime, teal } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';
import { SimplePaletteColorOptions } from '@mui/material/styles';
import styled from 'styled-components';

import { Money, MoneyLike } from 'shared/util';

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
  standard: '#e1e2e1',
  light: '#f5f5f6',
  dark: '#919192',
  veryDark: '#555555',
  text: '#000000',
};

const lightBrown: ColorDef = {
  standard: '#efebe9',
  light: '#ffffff',
  dark: '#bdb9b7',
  text: '#000000',
};

const orangeRed: ColorDef = {
  standard: '#ff8a65',
  light: '#ffbb93',
  dark: '#c75b39',
  text: '#000000',
};

export const primaryColors = lightBrown;
export const secondaryColors = orangeRed;

export const colorScheme: ColorScheme = {
  primary: primaryColors,
  secondary: secondaryColors,
  gray,
  text: '#000000',
  white: '#ffffff',
};

const primaryPalette: SimplePaletteColorOptions = {
  light: colorScheme.primary.light,
  dark: colorScheme.primary.dark,
  main: colorScheme.primary.standard,
  contrastText: colorScheme.primary.text,
};

const secondaryPalette: SimplePaletteColorOptions = {
  light: colorScheme.secondary.light,
  dark: colorScheme.secondary.dark,
  main: colorScheme.secondary.standard,
  contrastText: colorScheme.secondary.text,
};

export const navigation = colorScheme.secondary.standard;
export const white = colorScheme.primary.light;
export const navigationBar = '#e3dfdd';

// action is used in expense table category links
export const action = colorScheme.secondary.dark;

export const positive = colorScheme.primary.text;
export const negative = colorScheme.secondary.dark;
export const unimportant = colorScheme.gray.dark;
export const header = colorScheme.gray.dark;

export const topItem = teal[500];
export const subItem = grey[500];

export const tool = colorScheme.gray.veryDark;
export const unconfirmed = amber[50];

export const highlightBg = orangeRed.light;
export const highlightFg = orangeRed.dark;

export function diagonalStripes(
  color1: string,
  color2: string,
  width1: string,
  width2: string
): string {
  return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}

export const unconfirmedStripes = diagonalStripes(
  unconfirmed,
  white,
  '0.5em',
  '1em'
);
export const income = lime[100];

export function forMoney(m?: MoneyLike): string {
  if (!m) {
    return unimportant;
  }
  const b = Money.from(m);
  return b
    ? b.gt(0)
      ? positive
      : b.lt(0)
      ? negative
      : unimportant
    : unimportant;
}

export function classNameForMoney(
  m?: MoneyLike
): 'positive' | 'negative' | 'unimportant' {
  if (!m) {
    return 'unimportant';
  }
  const b = Money.from(m);
  return b
    ? b.gt(0)
      ? 'positive'
      : b.lt(0)
      ? 'negative'
      : 'unimportant'
    : 'unimportant';
}

export const muiTheme = createTheme({
  palette: {
    primary: secondaryPalette,
    secondary: primaryPalette,
  },
});

// This is here only so that we use styled in this file. We must reference styled here or
// else watch recompile fails with a warning "module not found" (looks like a bug)
export const unused = styled.div`
  width: 100%;
`;
