import { Money, MoneyLike } from 'shared/util';

const positive = 'light-dark(var(--mantine-color-dark-9), var(--mantine-color-green-4))';
const negative = 'light-dark(var(--mantine-color-red-7), var(--mantine-color-red-4))';
const unimportant = 'var(--mantine-color-dimmed)';
const unconfirmed = 'light-dark(var(--mantine-color-yellow-1), var(--mantine-color-yellow-9))';
const white = 'var(--mantine-color-white)';

export function diagonalStripes(
  color1: string,
  color2: string,
  width1: string,
  width2: string,
): string {
  return `repeating-linear-gradient(45deg, ${color1}, ${color1} ${width1}, ${color2} ${width1}, ${color2} ${width2})`;
}

export const unconfirmedStripes = diagonalStripes(unconfirmed, white, '0.5em', '1em');

export function forMoney(m?: MoneyLike): string {
  if (!m) {
    return unimportant;
  }
  const b = Money.from(m);
  return b ? (b.gt(0) ? positive : b.lt(0) ? negative : unimportant) : unimportant;
}

export function classNameForMoney(m?: MoneyLike): 'positive' | 'negative' | 'unimportant' {
  if (!m) {
    return 'unimportant';
  }
  const b = Money.from(m);
  return b ? (b.gt(0) ? 'positive' : b.lt(0) ? 'negative' : 'unimportant') : 'unimportant';
}

export function getLuminanceSafe(color: string): number {
  try {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return 0;
  }
}
