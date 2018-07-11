import 'jest';
import moment from 'moment';
import { toDateRangeName, monthRange, month, yearRange, getWeeksForMonth } from './Time';

describe('time', () => {

  describe('dateRange', () => {

    it('should format month name', () => {
      expect(toDateRangeName(monthRange(month(2017, 4)))).toEqual('Huhtikuu 2017');
      expect(toDateRangeName(monthRange(month(2025, 12)))).toEqual('Joulukuu 2025');
    });

    it('should format year name', () => {
      expect(toDateRangeName(yearRange(month(2017, 4)))).toEqual('2017');
      expect(toDateRangeName(yearRange(month(2025, 12)))).toEqual('2025');
    });

  });

  describe('weeks', () => {

    it('first day is monday', () => {
      expect(moment('2018-06-20T12:00:00Z').startOf('week').date()).toBe(18);
    });

    it('should return correct weeks', () => {
      expect(getWeeksForMonth('2018-07-11T12:00:00Z')).toMatchObject([
        { weekNumber: 26, year: 2018 },
        { weekNumber: 27, year: 2018 },
        { weekNumber: 28, year: 2018 },
        { weekNumber: 29, year: 2018 },
        { weekNumber: 30, year: 2018 },
        { weekNumber: 31, year: 2018 },
      ]);
      expect(getWeeksForMonth('2018-05-01T12:00:00Z')).toMatchObject([
        { weekNumber: 18, year: 2018 },
        { weekNumber: 19, year: 2018 },
        { weekNumber: 20, year: 2018 },
        { weekNumber: 21, year: 2018 },
        { weekNumber: 22, year: 2018 },
      ]);
      expect(getWeeksForMonth('2018-01-10T12:00:00Z')).toMatchObject([
        { weekNumber: 1, year: 2018 },
        { weekNumber: 2, year: 2018 },
        { weekNumber: 3, year: 2018 },
        { weekNumber: 4, year: 2018 },
        { weekNumber: 5, year: 2018 },
      ]);
      expect(getWeeksForMonth('2017-12-10T12:00:00Z')).toMatchObject([
        { weekNumber: 48, year: 2017 },
        { weekNumber: 49, year: 2017 },
        { weekNumber: 50, year: 2017 },
        { weekNumber: 51, year: 2017 },
        { weekNumber: 52, year: 2017 },
      ]);
      expect(getWeeksForMonth('2017-01-10T12:00:00Z')).toMatchObject([
        { weekNumber: 52, year: 2016 },
        { weekNumber: 1, year: 2017 },
        { weekNumber: 2, year: 2017 },
        { weekNumber: 3, year: 2017 },
        { weekNumber: 4, year: 2017 },
        { weekNumber: 5, year: 2017 },
      ]);
    });

  });
});
