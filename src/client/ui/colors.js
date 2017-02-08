import {cyan500, cyan800, purple800, pink800, grey500, grey600} from "material-ui/styles/colors";

export const highlight = cyan500;
export const action = cyan800;
export const positive = purple800;
export const negative = pink800;
export const unimportant = grey500;
export const header = grey600;

export const navigation = highlight;
export const tool = header;

export const forMoney = (b) => b ? (b.gt(0) ? positive : ( b.lt(0) ? negative : unimportant)) : unimportant;
