import { colors } from '@mui/material';

import { clamp } from 'shared/util/Numbers';

export const ChartColors = [
  colors.indigo,
  colors.teal,
  colors.lightGreen,
  colors.amber,
  colors.brown,
  colors.blueGrey,
];

type ColorType = typeof colors.indigo;
type ColorLighness = keyof ColorType;

const LightnessOffsets: ColorLighness[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
];

export function getChartColor(index: number, offset: number): string {
  return ChartColors[index % ChartColors.length][
    LightnessOffsets[clamp(offset, 0, LightnessOffsets.length - 1)]
  ];
}
