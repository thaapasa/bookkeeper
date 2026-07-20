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

export interface YearlyTotals {
  income: number;
  expense: number;
  surplus: number;
}

/**
 * Sums and per-year averages for the surplus table footer. The average surplus
 * is derived from the (truncated) average income and expense — not divided
 * independently — so the displayed row satisfies income - expense = surplus
 * exactly, like every yearly row above it.
 */
export function calculateYearlyTotals(years: YearlyChartRow[]): {
  sum: YearlyTotals;
  average: YearlyTotals;
} {
  const n = years.length;
  if (n === 0) {
    const zero: YearlyTotals = { income: 0, expense: 0, surplus: 0 };
    return { sum: zero, average: zero };
  }
  const income = Money.sum(years.map(y => y.income));
  const expense = Money.sum(years.map(y => y.expense));
  const avgIncome = income.divide(n);
  const avgExpense = expense.divide(n);
  return {
    sum: {
      income: income.valueOf(),
      expense: expense.valueOf(),
      surplus: income.minus(expense).valueOf(),
    },
    average: {
      income: avgIncome.valueOf(),
      expense: avgExpense.valueOf(),
      surplus: avgIncome.minus(avgExpense).valueOf(),
    },
  };
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
