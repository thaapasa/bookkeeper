import * as io from 'io-ts';

import { intStringBetween } from './Validator';

export const YearMonth = io.type({
  year: intStringBetween(1500, 3000),
  month: intStringBetween(1, 12),
});
export type YearMonth = io.TypeOf<typeof YearMonth>;
