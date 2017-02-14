import {cyan500, cyan800, purple800, pink800, grey500, grey600, amber100, lime100} from "material-ui/styles/colors";

export const white = "#FFFFFF";
export const highlight = cyan500;
export const action = cyan800;
export const positive = purple800;
export const negative = pink800;
export const unimportant = grey500;
export const header = grey600;

export const navigation = highlight;
export const tool = header;
export const unconfirmed = amber100;
export const unconfirmedStripes = diagonalStripes(unconfirmed, white, "0.5em", "1em");
export const income = lime100;

export function forMoney(b) {
    return b ? (b.gt(0) ? positive : ( b.lt(0) ? negative : unimportant)) : unimportant;
}

export function diagonalStripes(color1, color2, width1, width2) {
    return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}
