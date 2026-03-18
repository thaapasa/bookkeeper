import { createTheme, type MantineColorsTuple } from '@mantine/core';

/**
 * Mantine theme matching the existing Kukkaro color scheme.
 * Based on Colors.ts palette: warm brown primary, orange-red accent.
 */

// Primary palette: light brown tones (used for backgrounds, navigation)
const primary: MantineColorsTuple = [
  '#ffffff', // 0 - lightest
  '#f5f5f6', // 1
  '#efebe9', // 2 - standard (lightBrown)
  '#e3dfdd', // 3
  '#d5d0ce', // 4
  '#bdb9b7', // 5 - dark
  '#a5a1a0', // 6
  '#8e8a89', // 7
  '#767372', // 8
  '#5e5c5b', // 9 - darkest
];

// Secondary/accent palette: orange-red (used for actions, highlights)
const accent: MantineColorsTuple = [
  '#fff3ed', // 0 - lightest
  '#ffe4d6', // 1
  '#ffbb93', // 2 - light (orangeRed.light)
  '#ff8a65', // 3 - standard (orangeRed.standard)
  '#f57c56', // 4
  '#c75b39', // 5 - dark (orangeRed.dark)
  '#a94b2f', // 6
  '#8c3b25', // 7
  '#6e2d1b', // 8
  '#511f11', // 9 - darkest
];

export const mantineTheme = createTheme({
  primaryColor: 'accent',
  colors: {
    primary,
    accent,
  },
  fontFamily: 'Roboto, sans-serif',
  headings: {
    fontFamily: 'Roboto, sans-serif',
  },
  defaultRadius: 'sm',
});
