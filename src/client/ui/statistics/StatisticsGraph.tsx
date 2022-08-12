import * as React from 'react';

import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import { groupBy } from 'shared/util/Arrays';
import Money from 'shared/util/Money';
import { typedKeys } from 'shared/util/Objects';

import { DataLine } from '../chart/DataLine';
import { ChartScales, CommonChartProps } from '../chart/types';

interface StatisticsGraphProps extends CommonChartProps {
  data: CategoryStatistics;
}

export const StatisticsGraph: React.FC<StatisticsGraphProps> = ({
  data,
  scales,
  maxValue,
}) => (
  <g>
    {Object.keys(data.statistics).map(k => (
      <CategoryGraph
        key={k}
        data={data.statistics[k]}
        maxValue={maxValue}
        scales={scales}
      />
    ))}
  </g>
);

const CategoryGraph: React.FC<{
  data: CategoryStatisticsData[];
  scales: ChartScales;
  maxValue: number;
}> = ({ data, ...rest }) => {
  const byYears = groupBy(i => i.month.substring(0, 4), data);
  return (
    <>
      {typedKeys(byYears).map(y => (
        <YearLine key={y} year={y} data={byYears[y]} {...rest} />
      ))}
    </>
  );
};

const YearLine: React.FC<{
  year: string;
  data: CategoryStatisticsData[];
  scales: ChartScales;
  maxValue: number;
}> = ({ data, ...rest }) => {
  const values = data.map<[number, number]>(d => [
    Number(d.month.substring(5, 8)) - 1,
    Money.from(d.sum).valueOf(),
  ]);
  console.log(values);
  return <DataLine values={values} {...rest} maxKey={11} />;
};
