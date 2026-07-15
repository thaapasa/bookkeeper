import { Box, Group, Text, useComputedColorScheme } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import { YearlySeries, YearlySummaryChartData } from 'shared/statistics/YearlySummaryChartData';

import { formatMoney, formatMoneyThin, formatMoneyTick, useThinFormat } from '../chart/Format';

/**
 * Shade ramp endpoints for the stacked bars, one hue per money direction
 * (teal = income, pink = expense), all taken from the Mantine default
 * theme scales. Each series gets a shade interpolated between the
 * endpoints; the largest category is darkest, at the bottom of the stack.
 * Endpoints are validated per mode against the app card surfaces
 * (#fdfcf8 / #32302b): the light end keeps ≥2:1 contrast, and the span
 * gives visibly distinct steps up to ~5 series — beyond that adjacent
 * shades converge and the segment gaps, legend, and tooltip carry the
 * identity.
 */
const RAMPS = {
  light: {
    income: { dark: 'var(--mantine-color-teal-7)', light: 'var(--mantine-color-teal-2)' },
    expense: { dark: 'var(--mantine-color-pink-7)', light: 'var(--mantine-color-pink-2)' },
  },
  dark: {
    income: { dark: 'var(--mantine-color-teal-6)', light: 'var(--mantine-color-teal-2)' },
    expense: { dark: 'var(--mantine-color-pink-8)', light: 'var(--mantine-color-pink-2)' },
  },
};

interface Ramp {
  dark: string;
  light: string;
}

/** Shade for series `index` of `count`, interpolated dark→light in OKLab */
function rampColor(ramp: Ramp, index: number, count: number): string {
  if (count <= 1) return ramp.dark;
  const lightPct = Math.round((index / (count - 1)) * 100);
  return `color-mix(in oklab, ${ramp.light} ${lightPct}%, ${ramp.dark})`;
}

/** Surface-colored separator between stacked segments and around bars */
const SEGMENT_STROKE = 'var(--mantine-color-surface-0)';

export const YearlySummaryChart: React.FC<{ data: YearlySummaryChartData }> = ({ data }) => {
  const { ref, width } = useElementSize();
  return (
    <Box w="100%">
      <Box ref={ref} w="100%" h={360}>
        {width > 0 ? <ChartContent data={data} width={width} height={360} /> : null}
      </Box>
      <ChartLegend data={data} />
    </Box>
  );
};

const ChartContent: React.FC<{
  data: YearlySummaryChartData;
  width: number;
  height: number;
}> = ({ data, width, height }) => {
  const scheme = useComputedColorScheme('light');
  const ramps = RAMPS[scheme];
  const thin = useThinFormat({ width });
  return (
    <BarChart
      width={width}
      height={height}
      data={data.years}
      margin={{ left: 24, top: 16, right: 8, bottom: 0 }}
      barGap={2}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="year" />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoneyTick}
        width={thin ? 32 : undefined}
      />
      <Tooltip
        content={<SummaryTooltip data={data} />}
        cursor={{ fill: 'var(--mantine-color-default-hover)' }}
      />
      {data.incomeSeries.map((s, i) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.name}
          stackId="income"
          fill={rampColor(ramps.income, i, data.incomeSeries.length)}
          stroke={SEGMENT_STROKE}
          strokeWidth={1}
          maxBarSize={24}
        />
      ))}
      {data.expenseSeries.map((s, i) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.name}
          stackId="expense"
          fill={rampColor(ramps.expense, i, data.expenseSeries.length)}
          stroke={SEGMENT_STROKE}
          strokeWidth={1}
          maxBarSize={24}
        />
      ))}
    </BarChart>
  );
};

const ChartLegend: React.FC<{ data: YearlySummaryChartData }> = ({ data }) => {
  const scheme = useComputedColorScheme('light');
  const ramps = RAMPS[scheme];
  return (
    <Group gap="lg" justify="center" mt="xs" wrap="wrap">
      <LegendGroup title="Tulot" series={data.incomeSeries} ramp={ramps.income} />
      <LegendGroup title="Menot" series={data.expenseSeries} ramp={ramps.expense} />
    </Group>
  );
};

const LegendGroup: React.FC<{ title: string; series: YearlySeries[]; ramp: Ramp }> = ({
  title,
  series,
  ramp,
}) => (
  <Group gap="sm" wrap="wrap">
    <Text fz="sm" fw={600}>
      {title}
    </Text>
    {series.map((s, i) => (
      <Group key={s.key} gap={4} wrap="nowrap">
        <Box w={10} h={10} bg={rampColor(ramp, i, series.length)} style={{ borderRadius: 2 }} />
        <Text fz="sm" c="dimmed">
          {s.name}
        </Text>
      </Group>
    ))}
  </Group>
);

/** Tooltip: per-category sums for the hovered year, plus totals and surplus */
const SummaryTooltip: React.FC<{
  data: YearlySummaryChartData;
  active?: boolean;
  label?: number;
  payload?: { dataKey?: string | number; value?: number | string; fill?: string }[];
}> = ({ data, active, label, payload }) => {
  if (!active || !payload?.length) return null;
  const year = data.years.find(y => y.year === label);
  if (!year) return null;
  const bySeries = new Map(payload.map(p => [String(p.dataKey), p]));
  return (
    <Box
      p="sm"
      bg="var(--mantine-color-body)"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-sm)',
      }}
    >
      <Text fz="sm" fw={700}>
        {label}
      </Text>
      <TooltipSection
        title="Tulot"
        total={year.income}
        series={data.incomeSeries}
        rows={bySeries}
      />
      <TooltipSection
        title="Menot"
        total={year.expense}
        series={data.expenseSeries}
        rows={bySeries}
      />
      <Group gap="lg" justify="space-between" mt={4}>
        <Text fz="sm" fw={600}>
          Säästö
        </Text>
        <Text fz="sm" fw={600} c={year.surplus >= 0 ? 'teal.7' : 'pink.7'}>
          {formatMoney(year.surplus)}
        </Text>
      </Group>
    </Box>
  );
};

const TooltipSection: React.FC<{
  title: string;
  total: number;
  series: YearlySeries[];
  rows: Map<string, { value?: number | string; fill?: string }>;
}> = ({ title, total, series, rows }) => (
  <Box mt={4}>
    <Group gap="lg" justify="space-between">
      <Text fz="sm" fw={600}>
        {title}
      </Text>
      <Text fz="sm" fw={600}>
        {formatMoney(total)}
      </Text>
    </Group>
    {series.map(s => {
      const item = rows.get(s.key);
      const value = typeof item?.value === 'number' ? item.value : 0;
      if (value === 0) return null;
      return (
        <Group key={s.key} gap="lg" justify="space-between">
          <Group gap={4} wrap="nowrap">
            <Box w={8} h={8} bg={item?.fill} style={{ borderRadius: 2 }} />
            <Text fz="sm" c="dimmed">
              {s.name}
            </Text>
          </Group>
          <Text fz="sm" c="dimmed">
            {formatMoney(value)}
          </Text>
        </Group>
      );
    })}
  </Box>
);
