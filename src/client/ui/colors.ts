import * as colors from 'material-ui/styles/colors';
import Money, { MoneyLike } from '../../shared/util/money';

export const white = '#FFFFFF';
export const highlight = colors.cyan500;
export const action = colors.cyan800;
export const positive = colors.purple800;
export const negative = colors.pink800;
export const unimportant = colors.grey500;
export const header = colors.grey600;
export const topItem = colors.teal500;
export const subItem = colors.grey200;

export const navigation = highlight;
export const tool = header;
export const unconfirmed = colors.amber50;
export const unconfirmedStripes = diagonalStripes(unconfirmed, white, '0.5em', '1em');
export const income = colors.lime100;

export function forMoney(m?: MoneyLike): string {
    if (!m) { return unimportant; }
    const b = Money.from(m);
    return b ? (b.gt(0) ? positive : ( b.lt(0) ? negative : unimportant)) : unimportant;
}

export function diagonalStripes(color1: string, color2: string, width1: string, width2: string): string {
    return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}
