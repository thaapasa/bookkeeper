import { Money } from 'shared/util';

import { Size } from '../Types';

export const formatMoneyThin = (v: number) => (v > 1000 ? `${Math.round(v / 1000)}K` : `${v}`);

export const formatMoney = (v: number | string) => {
  try {
    return Money.from(v).format(0);
  } catch (e) {
    return '-';
  }
};

export function useThinFormat(size: Size) {
  return size.width < 550;
}
