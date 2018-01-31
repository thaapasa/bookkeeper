import * as moment from 'moment';

export function month(year: number, month: number): moment.Moment {
  return moment({ year: year, month: month - 1, day: 1 });
}

const datePattern = 'YYYY-MM-DD';
export function date(m: any): string {
  const mom = moment.isMoment(m) ? m : moment(m);
  return mom.format(datePattern);
}
export function fromDate(str: any): moment.Moment {
  return moment(str, datePattern);
}

export function iso(m: any): string {
  return moment(m).format('YYYY-MM-DDTHH:mm:ssZ');
}

const months = ['', 'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu',
  'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];

export function getFinnishMonthName(monthNumber: number): string {
  return months[monthNumber];
}
