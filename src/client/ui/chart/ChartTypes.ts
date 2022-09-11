export interface ChartKeyInfo {
  /** Chart data key name */
  key: string;
  /** Color to use for rendering this key */
  color: string;
  /** Label name */
  name?: string;
  /** True when this value is an estimate */
  estimate?: boolean;
  dataId: number;
}

export type ChartKeyType = string | number;

/**
 * Type denoting the items for each column (point in X-axis).
 * They record keys map to the keys in `ChartKeyInfo`, and the value
 * tells the position in the Y-axis.
 */
export type ChartColumnData<K extends ChartKeyType = ChartKeyType> = {
  [k in K]: number;
};

/**
 * Type denoting the items for each column (point in X-axis).
 * They record keys map to the keys in `ChartKeyInfo`, and the value
 * tells the position in the Y-axis.
 * The type L denotes the label name that contains the label of the x-axis position.
 */
export type ChartColumn<
  L extends string,
  K extends ChartKeyType = ChartKeyType
> = { [t in L]: string } & ChartColumnData<K>;

export interface ChartData<
  L extends string,
  K extends ChartKeyType = ChartKeyType
> {
  keys: ChartKeyInfo[];
  chartData: ChartColumn<L, K>[];
}
