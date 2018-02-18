import * as colors from 'material-ui/styles/colors';
import Money, { MoneyLike } from '../../shared/util/Money';
import styled from 'styled-components';

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
export const unconfirmedStripes = diagonalStripes(unconfirmed, white, '0.5em', '1em');
export const income = colors.lime100;

export function forMoney(m?: MoneyLike): string {
  if (!m) { return unimportant; }
  const b = Money.from(m);
  return b ? (b.gt(0) ? positive : (b.lt(0) ? negative : unimportant)) : unimportant;
}

export function diagonalStripes(color1: string, color2: string, width1: string, width2: string): string {
  return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}

// This is here only so that we use styled in this file. We must reference styled here or
// else watch recompile fails with a warning "module not found" (looks like a bug)
export const unused = styled.div`
  width: 100%;
`;
