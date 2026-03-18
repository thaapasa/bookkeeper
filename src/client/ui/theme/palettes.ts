/**
 * App color palettes using 10-step scales (like Mantine/Tailwind).
 * Index 0 = lightest, 9 = darkest.
 *
 * Semantic color roles map to specific scale indices, making it easy to
 * adjust contrast and prepare for dark mode (just shift the indices).
 */

/** 10-step color scale, lightest (0) to darkest (9) */
export type ColorScale = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export interface AppPalette {
  name: string;

  /** Neutral/primary scale — backgrounds, surfaces, borders */
  neutral: ColorScale;
  /** Accent scale — interactive elements, links, highlights */
  accent: ColorScale;

  // Semantic colors
  text: string;
  positive: string;
  negative: string;
  income: string;
  unconfirmed: string;

  // Font
  fontFamily: string;
}

/**
 * Semantic color mapping — picks indices from the palette scales.
 * This is where we define "what shade is used for what purpose."
 * For dark mode, we'd create an alternate mapping with shifted indices.
 */
export interface ResolvedColors {
  // Surfaces & backgrounds
  background: string;
  surface: string;
  navBar: string;

  // Primary shades (from neutral scale)
  primary: { lightest: string; light: string; standard: string; dark: string; text: string };
  // Accent shades (from accent scale)
  accentColors: { lightest: string; light: string; standard: string; dark: string; text: string };
  // Grays (from neutral scale)
  gray: { light: string; standard: string; dark: string; veryDark: string; text: string };

  // Semantic
  text: string;
  positive: string;
  negative: string;
  unimportant: string;
  income: string;
  unconfirmed: string;
  topItem: string;
  subItem: string;
  highlightBg: string;
  highlightFg: string;

  fontFamily: string;
}

/** Resolve a palette into concrete semantic colors (light mode) */
export function resolveColors(p: AppPalette): ResolvedColors {
  return {
    background: p.neutral[1],
    surface: p.neutral[0],
    navBar: p.neutral[2],

    primary: {
      lightest: p.neutral[0],
      light: p.neutral[1],
      standard: p.neutral[2],
      dark: p.neutral[4],
      text: p.text,
    },
    accentColors: {
      lightest: p.accent[0],
      light: p.accent[2],
      standard: p.accent[4],
      dark: p.accent[7],
      text: p.accent[9],
    },
    gray: {
      light: p.neutral[1],
      standard: p.neutral[3],
      dark: p.neutral[5],
      veryDark: p.neutral[7],
      text: p.text,
    },

    text: p.text,
    positive: p.positive,
    negative: p.negative,
    unimportant: p.neutral[5],
    income: p.income,
    unconfirmed: p.unconfirmed,
    topItem: p.accent[6],
    subItem: p.neutral[5],
    highlightBg: p.accent[1],
    highlightFg: p.accent[7],

    fontFamily: p.fontFamily,
  };
}

// ---------------------------------------------------------------------------
// Palette: Classic (warm brown + orange-red)
// ---------------------------------------------------------------------------
const classic: AppPalette = {
  name: 'Klassinen',
  neutral: [
    '#ffffff', // 0
    '#f5f5f6', // 1
    '#efebe9', // 2
    '#e3dfdd', // 3
    '#bdb9b7', // 4
    '#919192', // 5
    '#777675', // 6
    '#555555', // 7
    '#3a3a3a', // 8
    '#1a1a1a', // 9
  ],
  accent: [
    '#fff3ed', // 0
    '#ffbb93', // 1
    '#ffbb93', // 2
    '#ff8a65', // 3
    '#ff8a65', // 4
    '#e06840', // 5
    '#c75b39', // 6
    '#c75b39', // 7
    '#8c3b25', // 8
    '#511f11', // 9
  ],
  text: '#000000',
  positive: '#000000',
  negative: '#c75b39',
  income: '#dce775',
  unconfirmed: '#fff8e1',
  fontFamily: 'Roboto, sans-serif',
};

// ---------------------------------------------------------------------------
// Palette: Ocean (cool blues, slate grays)
// ---------------------------------------------------------------------------
const ocean: AppPalette = {
  name: 'Meri',
  neutral: [
    '#f5f7fa', // 0
    '#e8ecf0', // 1
    '#dfe4ea', // 2
    '#cdd6e0', // 3
    '#a8b4c4', // 4
    '#7585a0', // 5
    '#5a6a7d', // 6
    '#3d4d60', // 7
    '#283848', // 8
    '#0f172a', // 9
  ],
  accent: [
    '#d5e8f0', // 0
    '#b0d4e6', // 1
    '#6db8d6', // 2
    '#4a9ec4', // 3
    '#2d8bb5', // 4
    '#1d7199', // 5
    '#0d5e82', // 6
    '#08516e', // 7
    '#063d54', // 8
    '#042a3a', // 9
  ],
  text: '#0f172a',
  positive: '#0f172a',
  negative: '#c42b2b',
  income: '#7ad49e',
  unconfirmed: '#f5edca',
  fontFamily: "'Inter', 'Roboto', sans-serif",
};

// ---------------------------------------------------------------------------
// Palette: Forest (earthy greens, warm grays)
// ---------------------------------------------------------------------------
const forest: AppPalette = {
  name: 'Metsä',
  neutral: [
    '#f7f8f5', // 0
    '#eef0ea', // 1
    '#e4e8de', // 2
    '#d4dcc8', // 3
    '#b5bfa8', // 4
    '#8a9478', // 5
    '#6e7862', // 6
    '#4a4e42', // 7
    '#333828', // 8
    '#1a2e1a', // 9
  ],
  accent: [
    '#e8f5e8', // 0
    '#c6dfc6', // 1
    '#a3d0a3', // 2
    '#81b281', // 3
    '#5e9a5e', // 4
    '#4d7c4d', // 5
    '#3d663d', // 6
    '#2d5a2d', // 7
    '#1e4a1e', // 8
    '#0f3a0f', // 9
  ],
  text: '#1a2e1a',
  positive: '#1a2e1a',
  negative: '#b91c1c',
  income: '#a3d9a3',
  unconfirmed: '#fef3c7',
  fontFamily: "'Roboto', sans-serif",
};

// ---------------------------------------------------------------------------
// Palette: Sunset (warm terracotta + golden tones)
// ---------------------------------------------------------------------------
const sunset: AppPalette = {
  name: 'Aurinko',
  neutral: [
    '#fdfaf7', // 0
    '#f5f2ee', // 1
    '#f0e8df', // 2
    '#e7ddd0', // 3
    '#c8b8a4', // 4
    '#a09080', // 5
    '#8c8278', // 6
    '#57524c', // 7
    '#3d3832', // 8
    '#292524', // 9
  ],
  accent: [
    '#fef0e6', // 0
    '#f5d0b5', // 1
    '#e8a87c', // 2
    '#d9894f', // 3
    '#c2703e', // 4
    '#a85c30', // 5
    '#9a4f24', // 6
    '#7a3e1c', // 7
    '#5c2e14', // 8
    '#3e1e0c', // 9
  ],
  text: '#292524',
  positive: '#292524',
  negative: '#b91c1c',
  income: '#d4e89c',
  unconfirmed: '#fef3c7',
  fontFamily: "'Roboto', sans-serif",
};

// ---------------------------------------------------------------------------
// All palettes & active selection
// ---------------------------------------------------------------------------
export const palettes = { classic, ocean, forest, sunset } as const;
export type PaletteName = keyof typeof palettes;

/** Change this to switch palette. Will be configurable at runtime later. */
const activePalette: PaletteName = 'ocean';

export function getActivePalette(): AppPalette {
  return palettes[activePalette];
}

export function getResolvedColors(): ResolvedColors {
  return resolveColors(getActivePalette());
}
