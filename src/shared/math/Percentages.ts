import { sum } from './Numbers';

/**
 * Calculates the percentage distribution of the given values, such that:
 *
 * - the resulting array has the same number of entries
 * - negative values are disregarded
 * - the entries of the resulting array add up to 1.00
 * - the entries of the resulting array tell the percentage of how much that
 *   specific value contributed to the whole
 */
export function toPercentageDistribution(values: number[]): number[] {
  if (values.length < 0) return [];

  const total = values.map(a => Math.max(a, 0)).reduce(sum, 0);

  return values.map(v => (v > 0 ? v / total : 0));
}
