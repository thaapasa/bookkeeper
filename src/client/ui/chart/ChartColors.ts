import { colors } from '@mui/material';

import { clamp } from 'shared/math';

export const ChartColors = [
  colors.teal,
  colors.lightBlue,
  colors.indigo,
  colors.blueGrey,
  colors.green,
  colors.red,
  colors.purple,
  colors.pink,
  colors.amber,
  colors.lime,
];

type ColorType = typeof colors.indigo;
type ColorLighness = keyof ColorType;

const LightnessOffsets: ColorLighness[] = [700, 500, 400, 300, 200, 100];

export function getChartColor(index: number, offset: number): string {
  return ChartColors[index % ChartColors.length][
    LightnessOffsets[clamp(offset, 0, LightnessOffsets.length - 1)]
  ];
}
