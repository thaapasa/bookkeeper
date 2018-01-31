import * as moment from 'moment';

export const expensePagePath = '/p/kulut';
export const categoryPagePath = '/p/kategoriat';

export const expenseMonthPattern = 'YYYY-MM';
export function expenseMonthPathPattern(variable: string) {
  return expensePagePath + '/:' + variable;
}
export function expensesForMonthPath(date: Date) {
  return expensePagePath + '/' + moment(date).format(expenseMonthPattern);
}
