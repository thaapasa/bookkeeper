import { colors } from '@mui/material';

import { clamp } from 'shared/math';

export const ChartColors = [
  colors.blue,
  colors.lightBlue,
  colors.cyan,
  colors.teal,
  colors.green,
  colors.lightGreen,
  colors.lime,
  colors.amber,
  colors.orange,
  colors.deepOrange,
  colors.pink,
  colors.purple,
  colors.deepPurple,
  colors.indigo,
];

type ColorType = typeof colors.indigo;
type ColorLighness = keyof ColorType;

const LightnessOffsets: ColorLighness[] = [700, 500, 400, 300, 200, 100];

export function getChartColor(index: number, offset: number): string {
  return ChartColors[index % ChartColors.length][
    LightnessOffsets[clamp(offset, 0, LightnessOffsets.length - 1)]
  ];
}
