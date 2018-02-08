import * as moment from 'moment';

export const expensePagePath = '/p/kulut';
export const categoryPagePath = '/p/kategoriat';

export const yearPattern = 'YYYY';
export const monthPattern = 'YYYY-MM';
export function expenseMonthPathPattern(variable: string) {
  return expensePagePath + '/:' + variable;
}
export function expensesForMonthPath(date: Date) {
  return expensePagePath + '/' + moment(date).format(monthPattern);
}

export function categoryViewYearPattern(variable: string) {
  return categoryPagePath + '/y/:' + variable;
}
export function categoriesForYear(date: Date) {
  return categoryPagePath + '/y/' + moment(date).format(yearPattern);
}

export function categoryViewMonthPattern(variable: string) {
  return categoryPagePath + '/m/:' + variable;
}
export function categoriesForMonth(date: Date) {
  return categoryPagePath + '/m/' + moment(date).format(monthPattern);
}
