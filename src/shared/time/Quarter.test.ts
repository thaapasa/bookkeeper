import { expect, describe, it } from "bun:test";

import { getQuartersInRange, Quarter, toQuarter } from './Quarter';

describe('Quarter', () => {
  it('should generate quarters in range', () => {
    expect(
      getQuartersInRange({ startDate: '2017-12-31', endDate: '2018-01-01' })
    ).toMatchObject(['2017-Q4', '2018-Q1']);
    expect(
      getQuartersInRange({ startDate: '2017-07-01', endDate: '2017-09-30' })
    ).toMatchObject(['2017-Q3']);
    expect(
      getQuartersInRange({ startDate: '2017-06-30', endDate: '2017-09-30' })
    ).toMatchObject(['2017-Q2', '2017-Q3']);
    expect(
      getQuartersInRange({ startDate: '2017-06-30', endDate: '2017-10-01' })
    ).toMatchObject(['2017-Q2', '2017-Q3', '2017-Q4']);
    expect(
      getQuartersInRange({ startDate: '2017-06-30', endDate: '2017-12-31' })
    ).toMatchObject(['2017-Q2', '2017-Q3', '2017-Q4']);
    expect(
      getQuartersInRange({ startDate: '2017-07-01', endDate: '2019-06-01' })
    ).toMatchObject([
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

  it.each([
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

  it.each([['2017-Q1'], ['2017-Q2'], ['2017-Q3'], ['2017-Q4'], ['2670-Q3']])(
    'parses valid quarter %s',
    quarter => {
      expect(Quarter.parse(quarter)).toBe(quarter);
    }
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
});
