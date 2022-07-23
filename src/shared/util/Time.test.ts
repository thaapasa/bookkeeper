import 'jest';

import { month, monthRange, toDateRangeName, yearRange } from './Time';

describe('time', () => {
  describe('dateRange', () => {
    it('should format month name', () => {
      expect(toDateRangeName(monthRange(month(2017, 4)))).toEqual(
        'Huhtikuu 2017'
      );
      expect(toDateRangeName(monthRange(month(2025, 12)))).toEqual(
        'Joulukuu 2025'
      );
    });

    it('should format year name', () => {
      expect(toDateRangeName(yearRange(month(2017, 4)))).toEqual('2017');
      expect(toDateRangeName(yearRange(month(2025, 12)))).toEqual('2025');
    });
  });
});
