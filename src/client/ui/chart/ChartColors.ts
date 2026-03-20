import { DEFAULT_THEME } from '@mantine/core';

import { clamp } from 'shared/math';

/**
 * Chart color palette using Mantine's built-in color scales.
 * Colors ordered to maximize contrast between adjacent entries
 * (warm↔cool alternation) so 2-3 item charts are always distinct.
 */
const chartColorNames = [
  'blue',
  'orange',
  'teal',
  'red',
  'indigo',
  'lime',
  'pink',
  'green',
  'violet',
  'yellow',
  'cyan',
  'grape',
] as const;

/** Map offset (0=darkest, 5=lightest) to Mantine shade index */
const shadeMap = [7, 5, 4, 3, 2, 1] as const;

const c = DEFAULT_THEME.colors;

export function getChartColor(index: number, offset: number): string {
  const name = chartColorNames[index % chartColorNames.length];
  const shade = shadeMap[clamp(offset, 0, shadeMap.length - 1)];
  return c[name][shade];
}
