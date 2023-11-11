import { DateLike, toDayjs } from 'shared/time';

export const shortcutsPagePath = '/p/linkit';
export const expensePagePath = '/p/kulut';
export const categoryPagePath = '/p/kategoriat';
export const subscriptionsPagePath = '/p/tilaukset';
export const statisticsPage = '/p/tilastot';
export const searchPagePath = '/p/haku';
export const infoPagePath = '/p/info';
export const toolsPagePath = '/p/työkalut';
export const profilePagePath = '/p/profiili';
export const passwordPagePath = '/p/profiili/salasana';
export const trackingPagePath = '/p/seuranta';
export const newExpenseSuffix = '/uusi-kirjaus';

export const yearPattern = 'YYYY';
export const monthPattern = 'YYYY-MM';
export function expenseMonthPathPattern(variable: string) {
  return expensePagePath + '/m/:' + variable;
}
export function expensesForMonthPath(date: DateLike) {
  return expensePagePath + '/m/' + toDayjs(date).format(monthPattern);
}

export function categoryViewYearPattern(variable: string) {
  return categoryPagePath + '/y/:' + variable;
}
export function categoriesForYear(date: DateLike) {
  return categoryPagePath + '/y/' + toDayjs(date).format(yearPattern);
}

export function categoryViewMonthPattern(variable: string) {
  return categoryPagePath + '/m/:' + variable;
}
export function categoriesForMonth(date: DateLike) {
  return categoryPagePath + '/m/' + toDayjs(date).format(monthPattern);
}

export function monthSuffix(date: DateLike) {
  return '/m/' + toDayjs(date).format(monthPattern);
}

export function yearSuffix(date: DateLike) {
  return '/y/' + toDayjs(date).format(yearPattern);
}
