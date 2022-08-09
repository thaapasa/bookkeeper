import * as io from 'io-ts';

import { MoneyLike } from 'shared/util/Money';
import { ISOMonth } from 'shared/util/Time';

import { NonEmptyArray } from './Validator';

export const StatisticsSearchType = io.type({
  categoryIds: NonEmptyArray(io.number),
});
export type StatisticsSearchType = io.TypeOf<typeof StatisticsSearchType>;

export const CategoryStatisticsData = io.type({
  sum: MoneyLike,
  month: ISOMonth,
  categoryId: io.number,
});
export type CategoryStatisticsData = io.TypeOf<typeof CategoryStatisticsData>;

export const CategoryStatistics = io.intersection([
  StatisticsSearchType,
  io.type({
    statistics: io.record(io.string, io.array(CategoryStatisticsData)),
  }),
]);
export type CategoryStatistics = io.TypeOf<typeof CategoryStatistics>;
