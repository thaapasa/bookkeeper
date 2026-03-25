import { Table } from '@mantine/core';
import * as React from 'react';

/**
 * ExpenseTableLayout — Mantine Table wrapper with fixed layout for expense tables.
 *
 * This file also re-exports all row-related components from their new locations
 * to maintain backward compatibility with existing imports.
 */

export const ExpenseTableLayout: React.FC<
  React.PropsWithChildren<{ loading?: boolean; padded?: boolean; className?: string }>
> = ({ loading, padded, className, children }) => (
  <Table
    layout="fixed"
    withRowBorders={false}
    withTableBorder={false}
    horizontalSpacing={0}
    fz="sm"
    className={className}
    styles={{ td: { overflow: 'hidden', textOverflow: 'ellipsis' } }}
    style={{
      ...(loading ? { opacity: 0.4 } : undefined),
      ...(padded ? { padding: '0 16px' } : undefined),
    }}
  >
    {children}
  </Table>
);

/* Re-exports for backward compatibility */
export {
  AvatarColumn,
  BalanceColumn,
  CategoryColumn,
  type ColumnProps,
  DateColumn,
  NameColumn,
  ReceiverColumn,
  Row,
  SourceColumn,
  SumColumn,
  ToolColumn,
} from './ColumnComponents';
export {
  columnSizes,
  getVisibleColumns,
  maxColumnsForSize,
  rowHeight,
  sourceWidth,
} from './columns';
export { computeDayParities, DayParityContext } from './DayParity';
export { AllColumns, LoadingIndicator, RecurringExpenseSeparator } from './SpecialRows';
export { IconToolArea, RecurringExpenseIcon, UnconfirmedIcon } from './TableIcons';
