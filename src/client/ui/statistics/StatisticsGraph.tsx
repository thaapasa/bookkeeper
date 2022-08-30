import * as React from 'react';

import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import { groupBy, numberRange } from 'shared/util/Arrays';
import Money from 'shared/util/Money';
import { recordFromPairs, typedKeys } from 'shared/util/Objects';
import { toMoment } from 'shared/util/Time';
import { dateRangeToMomentRange, MomentRange } from 'shared/util/TimeRange';

import { getChartColor } from '../chart/ChartColors';
import { DataLines } from '../chart/DataLine';
import { ChartDataLine, CommonChartProps } from '../chart/types';

interface StatisticsGraphProps extends CommonChartProps<number> {
  data: CategoryStatistics;
}

export const StatisticsGraph: React.FC<StatisticsGraphProps> = ({
  data,
  ...rest
}) => {
  const chartData = React.useMemo(() => convertData(data), [data]);
  return (
    <g>
      <DataLines data={chartData} {...rest} />
    </g>
  );
};

function convertData(data: CategoryStatistics): ChartDataLine<number>[] {
  const keys = typedKeys(data.statistics);
  const range = dateRangeToMomentRange(data.range);
  return keys
    .map((k, i) => convertAllYears(k, i, data.statistics[k], range))
    .flat();
}

function convertAllYears(
  key: string,
  categoryIdx: number,
  data: CategoryStatisticsData[],
  range: MomentRange
): ChartDataLine<string>[] {
  const thisYear = toMoment().year();
  const byYears = groupBy(i => i.month.substring(0, 4), data);
  return typedKeys(byYears).map(year =>
    convertOneYear(
      `${key}-${year}`,
      categoryIdx,
      thisYear - Number(year),
      byYears[year],
      range
    )
  );
}

function convertOneYear(
  key: string,
  categoryIdx: number,
  yearIdx: number,
  data: CategoryStatisticsData[],
  range: MomentRange
): ChartDataLine<string> {
  const line = yearDataToDataPoints(data, range);
  return {
    ...recordFromPairs(line.map(([d, v]) => [String(d), v])),
    key,
    color: getChartColor(categoryIdx, yearIdx),
  } as any;
}

function yearDataToDataPoints(
  data: CategoryStatisticsData[],
  range: MomentRange
): [number, number][] {
  if (data.length < 1) {
    return [];
  }
  const inputMonths = data.map<[number, number]>(d => [
    Number(d.month.substring(5, 8)) - 1,
    Money.from(d.sum).valueOf(),
  ]);
  const inputMap = recordFromPairs(inputMonths);

  const minMonth = data[0].month;
  const startPoint =
    !minMonth || range.startTime.isBefore(`${minMonth}-01`)
      ? 0
      : inputMonths[0][0];

  const maxMonth = data[data.length - 1]?.month;
  const maxMonthM = maxMonth ? toMoment(`${maxMonth}-01`) : undefined;
  const endPoint = !maxMonthM
    ? 11
    : range.endTime.isAfter(maxMonthM)
    ? range.endTime.isAfter(maxMonthM.endOf('year'))
      ? 11
      : range.endTime.month()
    : inputMonths[inputMonths.length - 1][0];

  return numberRange(startPoint, endPoint).map(m => [m, inputMap[m] ?? 0]);
}
