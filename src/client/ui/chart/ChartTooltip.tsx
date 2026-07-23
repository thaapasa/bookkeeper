import * as React from 'react';
import { Tooltip, TooltipProps, TooltipValueType } from 'recharts';

import { chartTooltipStyle, formatMoneyForChart } from './Format';

/** Lifts tooltips above surrounding content (e.g. sibling cards when the chart card allows overflow) */
const WrapperStyle = { zIndex: 2 };

/**
 * CSS-anchors the tooltip wrapper to the chart bottom (top: auto overrides the
 * default top: 0), so its layout box extends upwards and never grows the page
 * scroll height.
 */
const BottomAnchorStyle = { top: 'auto', bottom: 0 } as const;

export interface ChartTooltipProps extends TooltipProps<TooltipValueType, string | number> {
  /**
   * Which chart edge the tooltip is clamped to when it is taller than the chart.
   * Recharts only supports clamping to the top edge (the default); 'bottom' anchors
   * the tooltip to the chart bottom so it grows upwards instead — use it for charts
   * near the bottom of the page, where there is more room above the chart than
   * below it. The x-coordinate follows the cursor as usual.
   */
  anchor?: 'top' | 'bottom';
}

/**
 * Recharts Tooltip with the app defaults (money formatter, theme-aware content
 * style) and an optional bottom anchor for charts near the bottom of the page.
 * All recharts Tooltip props can still be overridden.
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  anchor = 'top',
  contentStyle,
  wrapperStyle,
  position,
  ...rest
}) => (
  <Tooltip
    formatter={formatMoneyForChart}
    {...rest}
    contentStyle={{ ...chartTooltipStyle, ...contentStyle }}
    wrapperStyle={{
      ...WrapperStyle,
      ...wrapperStyle,
      ...(anchor === 'bottom' ? BottomAnchorStyle : undefined),
    }}
    // The fixed position.y keeps recharts from adding a vertical translate on
    // top of the CSS bottom anchor
    position={anchor === 'bottom' ? { ...position, y: 0 } : position}
  />
);
