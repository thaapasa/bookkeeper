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
import { DataLine } from '../chart/DataLine';
import { ChartMargins, CommonChartProps } from '../chart/types';

interface StatisticsGraphProps extends CommonChartProps<string> {
  data: CategoryStatistics;
}

export const StatisticsGraph: React.FC<StatisticsGraphProps> = ({
  data,
  ...rest
}) => (
  <g>
    {Object.keys(data.statistics).map((k, index) => (
      <CategoryGraph
        {...rest}
        key={k}
        index={index}
        data={data.statistics[k]}
        range={dateRangeToMomentRange(data.range)}
      />
    ))}
  </g>
);

const CategoryGraph: React.FC<
  CommonChartProps<string> & {
    data: CategoryStatisticsData[];
    index: number;
    range: MomentRange;
  }
> = ({ data, index, ...rest }) => {
  const byYears = groupBy(i => i.month.substring(0, 4), data);
  return (
    <>
      {typedKeys(byYears).map(y => (
        <YearLine
          key={y}
          year={y}
          data={byYears[y]}
          color={getChartColor(index, 2022 - Number(y))}
          {...rest}
        />
      ))}
    </>
  );
};

const YearLine: React.FC<
  CommonChartProps<string> & {
    year: string;
    data: CategoryStatisticsData[];
    margins: ChartMargins;
    color: string;
    range: MomentRange;
  }
> = ({ data, range, year, ...rest }) => {
  const values = yearDataToDataPoints(data, range);
  return <DataLine values={values} {...rest} maxKey={11} />;
};

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
