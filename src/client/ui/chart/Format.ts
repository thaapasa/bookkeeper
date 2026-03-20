import { Money } from 'shared/util';

import { Size } from '../Styles';

export const formatMoneyThin = (v: number) => (v > 1000 ? `${Math.round(v / 1000)}K` : `${v}`);

export const formatMoney = (v: number | string) => {
  try {
    return Money.from(v).format(0);
  } catch {
    return '-';
  }
};

/** Formatter for Recharts tooltips that handles undefined values */
export const formatMoneyForChart = (v: number | string | undefined) =>
  formatMoney(typeof v === 'number' || typeof v === 'string' ? v : 0);

export function useThinFormat(size: Size) {
  return size.width < 550;
}
