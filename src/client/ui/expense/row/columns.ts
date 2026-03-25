import { getScreenSizeClassName, ScreenSizeClassName, Size } from 'client/ui/layout/Styles.ts';

/* Column visibility */

const columns = [
  'date',
  'avatar',
  'name',
  'receiver',
  'category',
  'source',
  'sum',
  'balance',
  'tools',
] as const;
type ExpenseRowColumns = (typeof columns)[number];

export const columnSizes: Record<ExpenseRowColumns, ScreenSizeClassName> = {
  date: 'mobile-portrait',
  avatar: 'mobile-portrait',
  name: 'mobile-portrait',
  receiver: 'mobile-landscape',
  category: 'mobile-landscape',
  source: 'web',
  sum: 'mobile-portrait',
  balance: 'web',
  tools: 'mobile-portrait',
};

export const maxColumnsForSize = {
  'mobile-portrait': columns.filter(c => columnSizes[c] === 'mobile-portrait').length,
  'mobile-landscape': columns.filter(
    c => columnSizes[c] === 'mobile-portrait' || columnSizes[c] === 'mobile-landscape',
  ).length,
  web: columns.length,
  large: columns.length,
};

export function getVisibleColumns(windowSize: Size) {
  return maxColumnsForSize[getScreenSizeClassName(windowSize)];
}

/* Constants */

export const rowHeight = 40;
export const sourceWidth = 52;
