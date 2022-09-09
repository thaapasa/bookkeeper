import { ChartColumn } from './ChartTypes';

export function fillMissingForNumericKeys<T extends string>(
  data: ChartColumn<T, number>,
  keys: (string | number)[]
): ChartColumn<T, number> {
  for (const k of keys) {
    data[Number(k)] ??= 0;
  }
  return data;
}
