import * as colors from 'material-ui/styles/colors';

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

export function forMoney(b) {
    return b ? (b.gt(0) ? positive : ( b.lt(0) ? negative : unimportant)) : unimportant;
}

export function diagonalStripes(color1, color2, width1, width2) {
    return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}
