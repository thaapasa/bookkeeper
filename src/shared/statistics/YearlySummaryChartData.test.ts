import { describe, expect, it } from 'bun:test';

import { Category, CategoryMap, YearlySummaryRow } from '../types';
import { createYearlySummaryChartData } from './YearlySummaryChartData';

const category = (id: number, name: string): Category => ({
  id,
  parentId: null,
  name,
  fullName: name,
  excludeFromTotals: false,
});

const categoryMap: CategoryMap = {
  '1': category(1, 'Palkat'),
  '2': category(2, 'Asuminen'),
  '3': category(3, 'Ruoka'),
};

const row = (
  year: number,
  categoryId: number,
  type: YearlySummaryRow['type'],
  sum: string,
): YearlySummaryRow => ({ year, categoryId, type, sum });

describe('createYearlySummaryChartData', () => {
  it('returns empty data for empty input', () => {
    expect(createYearlySummaryChartData([], categoryMap)).toEqual({
      years: [],
      incomeSeries: [],
      expenseSeries: [],
    });
  });

  it('shapes a single year with surplus = income - expense', () => {
    const data = createYearlySummaryChartData(
      [row(2024, 1, 'income', '2500.00'), row(2024, 2, 'expense', '1000.50')],
      categoryMap,
    );
    expect(data.years).toEqual([
      {
        year: 2024,
        income: 2500,
        expense: 1000.5,
        surplus: 1499.5,
        'income-1': 2500,
        'expense-2': 1000.5,
      },
    ]);
    expect(data.incomeSeries).toEqual([{ key: 'income-1', name: 'Palkat' }]);
    expect(data.expenseSeries).toEqual([{ key: 'expense-2', name: 'Asuminen' }]);
  });

  it('fills gap years with zero rows', () => {
    const data = createYearlySummaryChartData(
      [row(2020, 2, 'expense', '100.00'), row(2023, 2, 'expense', '200.00')],
      categoryMap,
    );
    expect(data.years.map(y => y.year)).toEqual([2020, 2021, 2022, 2023]);
    expect(data.years[1]).toEqual({
      year: 2021,
      income: 0,
      expense: 0,
      surplus: 0,
      'expense-2': 0,
    });
  });

  it('orders series largest total first and sums across years', () => {
    const data = createYearlySummaryChartData(
      [
        row(2023, 3, 'expense', '300.00'),
        row(2023, 2, 'expense', '100.00'),
        row(2024, 2, 'expense', '600.00'),
        row(2024, 3, 'expense', '150.00'),
      ],
      categoryMap,
    );
    // Asuminen 700 > Ruoka 450
    expect(data.expenseSeries.map(s => s.name)).toEqual(['Asuminen', 'Ruoka']);
    expect(data.years[1]['expense-2']).toBe(600);
    expect(data.years[1].expense).toBe(750);
  });

  it('falls back to a generic name for unknown categories', () => {
    const data = createYearlySummaryChartData([row(2024, 99, 'expense', '10.00')], categoryMap);
    expect(data.expenseSeries).toEqual([{ key: 'expense-99', name: 'Kategoria 99' }]);
  });
});
