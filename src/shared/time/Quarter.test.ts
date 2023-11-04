import { describe, expect, it } from 'bun:test';

import { getQuartersInRange, monthToQuarter, Quarter, toQuarter } from './Quarter';
import { ISODate, ISOMonth } from './Time';

describe('Quarter', () => {
  it('should generate quarters in range', () => {
    expect(getQuartersInRange({ startDate: '2017-12-31', endDate: '2018-01-01' })).toMatchObject([
      '2017-Q4',
      '2018-Q1',
    ]);
    expect(getQuartersInRange({ startDate: '2017-07-01', endDate: '2017-09-30' })).toMatchObject([
      '2017-Q3',
    ]);
    expect(getQuartersInRange({ startDate: '2017-06-30', endDate: '2017-09-30' })).toMatchObject([
      '2017-Q2',
      '2017-Q3',
    ]);
    expect(getQuartersInRange({ startDate: '2017-06-30', endDate: '2017-10-01' })).toMatchObject([
      '2017-Q2',
      '2017-Q3',
      '2017-Q4',
    ]);
    expect(getQuartersInRange({ startDate: '2017-06-30', endDate: '2017-12-31' })).toMatchObject([
      '2017-Q2',
      '2017-Q3',
      '2017-Q4',
    ]);
    expect(getQuartersInRange({ startDate: '2017-07-01', endDate: '2019-06-01' })).toMatchObject([
      '2017-Q3',
      '2017-Q4',
      '2018-Q1',
      '2018-Q2',
      '2018-Q3',
      '2018-Q4',
      '2019-Q1',
      '2019-Q2',
    ]);
  });

  it.each<[ISODate, Quarter]>([
    ['2017-01-01', '2017-Q1'],
    ['2017-01-15', '2017-Q1'],
    ['2017-03-31', '2017-Q1'],
    ['2017-04-01', '2017-Q2'],
    ['2017-06-16', '2017-Q2'],
    ['2017-06-30', '2017-Q2'],
    ['2020-12-01', '2020-Q4'],
    ['2020-12-31', '2020-Q4'],
  ])('should convert %s to quarter %s', (input, quarter) => {
    expect(toQuarter(input)).toBe(quarter);
  });

  it.each<[Quarter]>([['2017-Q1'], ['2017-Q2'], ['2017-Q3'], ['2017-Q4'], ['2670-Q3']])(
    'parses valid quarter %s',
    quarter => {
      expect(Quarter.parse(quarter)).toBe(quarter);
    },
  );

  it.each([
    ['2017-Q0'],
    ['2017-Q11'],
    ['2017-Q1 '],
    ['2017-Q1a'],
    ['2017-1'],
    ['201-Q1'],
    ['2018'],
    [''],
  ])('rejects invalid quarter %s', quarter => {
    expect(Quarter.safeParse(quarter)).toMatchObject({ success: false });
  });

  it.each<[ISOMonth, Quarter]>([
    ['2016-01', '2016-Q1'],
    ['2016-02', '2016-Q1'],
    ['2016-03', '2016-Q1'],
    ['2016-04', '2016-Q2'],
    ['2016-05', '2016-Q2'],
    ['2016-06', '2016-Q2'],
    ['2016-07', '2016-Q3'],
    ['2016-08', '2016-Q3'],
    ['2016-09', '2016-Q3'],
    ['2016-10', '2016-Q4'],
    ['2016-11', '2016-Q4'],
    ['2016-12', '2016-Q4'],
  ])('converts month %s as quarter %s', (m, q) => {
    expect(monthToQuarter(m)).toBe(q);
  });
});
