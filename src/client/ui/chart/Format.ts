import Money from 'shared/util/Money';

import { Size } from '../utils/useElementSize';

export const formatMoneyThin = (v: number) =>
  v > 1000 ? `${Math.round(v / 1000)}K` : `${v}`;

export const formatMoney = (v: number) => Money.from(v).format();

export function useThinFormat(size: Size) {
  return size.width < 550;
}
