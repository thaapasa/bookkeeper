import * as moment from 'moment';

type Moment = moment.Moment;

export function month(year: number, month: number): Moment {
    return moment({ year: year, month: month - 1, day: 1});
}

const datePattern = 'YYYY-MM-DD';
export function date(m: any): string {
    const mom = (m instanceof moment) ? m : moment(m);
    return mom.format(datePattern);
}
export function fromDate(str: any): Moment {
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
