import { DateLike, toMoment } from '../../shared/util/Time';

export const expensePagePath = '/p/kulut';
export const categoryPagePath = '/p/kategoriat';
export const newExpensePath = expensePagePath + '/uusi';

export const yearPattern = 'YYYY';
export const monthPattern = 'YYYY-MM';
export function expenseMonthPathPattern(variable: string) {
  return expensePagePath + '/m/:' + variable;
}
export function expensesForMonthPath(date: DateLike) {
  return expensePagePath + '/m/' + toMoment(date).format(monthPattern);
}

export function categoryViewYearPattern(variable: string) {
  return categoryPagePath + '/y/:' + variable;
}
export function categoriesForYear(date: DateLike) {
  return categoryPagePath + '/y/' + toMoment(date).format(yearPattern);
}

export function categoryViewMonthPattern(variable: string) {
  return categoryPagePath + '/m/:' + variable;
}
export function categoriesForMonth(date: DateLike) {
  return categoryPagePath + '/m/' + toMoment(date).format(monthPattern);
}

export function monthSuffix(date: DateLike) {
  return '/m/' + toMoment(date).format(monthPattern);
}

export function yearSuffix(date: DateLike) {
  return '/y/' + toMoment(date).format(yearPattern);
}
