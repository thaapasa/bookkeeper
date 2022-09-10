import {
  ChartColumn,
  ChartData,
  ChartKeyInfo,
  ChartKeyType,
} from './ChartTypes';

export function fillMissingForNumericKeys<T extends string>(
  data: ChartColumn<T, number>,
  keys: (string | number)[]
): ChartColumn<T, number> {
  for (const k of keys) {
    data[Number(k)] ??= 0;
  }
  return data;
}

export function mapChartData<
  L extends string,
  K extends ChartKeyType = ChartKeyType
>(
  data: ChartData<L, K>,
  keyMapper: (key: ChartKeyInfo, i: number) => ChartKeyInfo[],
  columnMapper: (data: ChartColumn<L, K>, i: number) => ChartColumn<L, K>
): ChartData<L, K> {
  const mappedKeys = data.keys.map(keyMapper).flat(1);
  const mappedColumns = data.chartData.map(columnMapper);
  return { keys: mappedKeys, chartData: mappedColumns };
}
