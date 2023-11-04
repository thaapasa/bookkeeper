import { describe, expect, it } from 'bun:test';

import { getSeasonsInRange, Season, toSeason } from './Season';
import { ISODate } from './Time';

describe('Season', () => {
  it.each([['2016-Spring'], ['2016-Summer'], ['2016-Autumn'], ['2016-2017-Winter']])(
    'parses valid season %s',
    season => {
      expect(Season.parse(season)).toBe(season);
    },
  );

  it.each([['2017-Q1'], ['2017-Winter'], ['2017-2018-Summer'], ['']])(
    'rejects invalid season %s',
    season => {
      expect(Season.safeParse(season)).toMatchObject({ success: false });
    },
  );

  it.each<[ISODate, Season]>([
    ['2017-01-01', '2016-2017-Winter'],
    ['2017-01-15', '2016-2017-Winter'],
    ['2017-03-31', '2017-Spring'],
    ['2017-04-01', '2017-Spring'],
    ['2017-06-16', '2017-Summer'],
    ['2017-06-30', '2017-Summer'],
    ['2017-08-31', '2017-Summer'],
    ['2017-09-01', '2017-Autumn'],
    ['2020-12-01', '2020-2021-Winter'],
    ['2020-12-31', '2020-2021-Winter'],
  ])('should convert %s to season %s', (input, quarter) => {
    expect(toSeason(input)).toBe(quarter);
  });

  it('should generate seasons in range', () => {
    expect(getSeasonsInRange({ startDate: '2017-12-31', endDate: '2018-01-01' })).toMatchObject([
      '2017-2018-Winter',
    ]);
    expect(getSeasonsInRange({ startDate: '2017-12-31', endDate: '2018-05-01' })).toMatchObject([
      '2017-2018-Winter',
      '2018-Spring',
    ]);
    expect(getSeasonsInRange({ startDate: '2020-05-24', endDate: '2022-10-04' })).toMatchObject([
      '2020-Spring',
      '2020-Summer',
      '2020-Autumn',
      '2020-2021-Winter',
      '2021-Spring',
      '2021-Summer',
      '2021-Autumn',
      '2021-2022-Winter',
      '2022-Spring',
      '2022-Summer',
      '2022-Autumn',
    ]);
  });
});
