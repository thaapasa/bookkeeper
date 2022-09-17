import { z } from 'zod';

export const Months = [
  'Tammi',
  'Helmi',
  'Maalis',
  'Huhti',
  'Touko',
  'Kesä',
  'Heinä',
  'Elo',
  'Syys',
  'Loka',
  'Marras',
  'Joulu',
];

export const StatisticsChartType = z.enum([
  'years',
  'seasons',
  'quarters',
  'months',
  'recurring',
]);
export type StatisticsChartType = z.infer<typeof StatisticsChartType>;
