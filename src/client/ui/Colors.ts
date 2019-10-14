import styled from 'styled-components';
import * as colors from 'material-ui/styles/colors';
import Money, { MoneyLike } from '../../shared/util/Money';
import { getMuiTheme } from 'material-ui/styles';
import { createMuiTheme } from '@material-ui/core';
import { SimplePaletteColorOptions } from '@material-ui/core/styles';

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

const gray = {
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

export const colorScheme: ColorScheme = {
  primary: lightBrown,
  secondary: orangeRed,
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

// action is used in expense table category links
export const action = colorScheme.secondary.dark;

export const positive = colorScheme.primary.text;
export const negative = colorScheme.secondary.dark;
export const unimportant = colorScheme.gray.dark;
export const header = colorScheme.gray.dark;

export const topItem = colors.teal500;
export const subItem = colors.grey200;

export const tool = colorScheme.gray.veryDark;
export const unconfirmed = colors.amber50;

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
export const income = colors.lime100;

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

export const muiTheme = getMuiTheme({
  palette: {
    primary1Color: colorScheme.secondary.standard,
    primary2Color: colorScheme.primary.standard,
    accent1Color: colorScheme.secondary.dark,
    accent2Color: colorScheme.primary.standard,
    textColor: colorScheme.text,
    pickerHeaderColor: colorScheme.secondary.dark,
    secondaryTextColor: colorScheme.secondary.text,
    alternateTextColor: colorScheme.secondary.light,
    canvasColor: colorScheme.primary.light,
  },
  appBar: {
    height: 56,
  },
});

export const muiThemeMUICore = createMuiTheme({
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
