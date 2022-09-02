export type Domain = string | number;

export type ChartDataLine<X extends Domain> = {
  key: string;
  color?: string;
} & Partial<Record<X, number>>;

export type ChartDataColumn<X extends Domain> = {
  domain: X;
  values: { key: string; color?: string; value: number }[];
};
