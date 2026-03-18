import { createTheme, type MantineColorsTuple } from '@mantine/core';

import type { AppPalette } from './palettes';
import { getActivePalette } from './palettes';

/** Generate a Mantine theme from an app palette */
function buildMantineTheme(palette: AppPalette) {
  const neutral = [...palette.neutral] as unknown as MantineColorsTuple;
  const accent = [...palette.accent] as unknown as MantineColorsTuple;

  return createTheme({
    primaryColor: 'accent',
    colors: { neutral, accent },
    fontFamily: palette.fontFamily,
    headings: { fontFamily: palette.fontFamily },
    defaultRadius: 'sm',
  });
}

export const mantineTheme = buildMantineTheme(getActivePalette());
