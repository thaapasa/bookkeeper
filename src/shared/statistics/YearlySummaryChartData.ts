import { CategoryMap, YearlySummaryRow } from '../types';
import { Money } from '../util/Money';

/** One series (= one top-level category) in a stack */
export interface YearlySeries {
  /** Chart data key, e.g. `income-12` */
  key: string;
  name: string;
}

/** One chart row per year; per-series sums keyed by YearlySeries.key */
export interface YearlyChartRow {
  year: number;
  income: number;
  expense: number;
  surplus: number;
  [seriesKey: string]: number;
}

export interface YearlySummaryChartData {
  years: YearlyChartRow[];
  /** Largest first = bottom of the stack */
  incomeSeries: YearlySeries[];
  expenseSeries: YearlySeries[];
}

/**
 * Shapes the raw per-year/category/type sums into recharts-ready rows.
 * Every top-level category gets its own series, largest first. Years
 * between the first and last data year are filled in with zero rows.
 */
export function createYearlySummaryChartData(
  rows: YearlySummaryRow[],
  categoryMap: CategoryMap,
): YearlySummaryChartData {
  if (rows.length < 1) {
    return { years: [], incomeSeries: [], expenseSeries: [] };
  }
  const incomeSeries = pickSeries(rows, 'income', categoryMap);
  const expenseSeries = pickSeries(rows, 'expense', categoryMap);

  const yearNums = rows.map(r => r.year);
  const firstYear = Math.min(...yearNums);
  const lastYear = Math.max(...yearNums);

  const years: YearlyChartRow[] = [];
  for (let year = firstYear; year <= lastYear; ++year) {
    const yearRows = rows.filter(r => r.year === year);
    const row: YearlyChartRow = { year, income: 0, expense: 0, surplus: 0 };
    [...incomeSeries, ...expenseSeries].forEach(s => (row[s.key] = 0));
    for (const r of yearRows) {
      const key = seriesKey(r.type, r.categoryId);
      row[key] = Money.from(row[key]).plus(r.sum).valueOf();
      row[r.type] = Money.from(row[r.type]).plus(r.sum).valueOf();
    }
    row.surplus = Money.from(row.income).minus(row.expense).valueOf();
    years.push(row);
  }
  return { years, incomeSeries, expenseSeries };
}

function seriesKey(type: YearlySummaryRow['type'], categoryId: number): string {
  return `${type}-${categoryId}`;
}

function pickSeries(
  rows: YearlySummaryRow[],
  type: YearlySummaryRow['type'],
  categoryMap: CategoryMap,
): YearlySeries[] {
  const totals = new Map<number, Money>();
  for (const r of rows) {
    if (r.type !== type) continue;
    totals.set(r.categoryId, (totals.get(r.categoryId) ?? Money.from(0)).plus(r.sum));
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1].valueOf() - a[1].valueOf());
  return ranked.map(([id]) => ({
    key: seriesKey(type, id),
    name: categoryMap[String(id)]?.name ?? `Kategoria ${id}`,
  }));
}
