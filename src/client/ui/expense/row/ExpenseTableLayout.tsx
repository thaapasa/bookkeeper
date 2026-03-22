import { Box, BoxProps, Center, Loader, Table } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { windowSizeP } from 'client/data/State';
import { connect } from 'client/ui/component/BaconConnect';
import { Icons } from 'client/ui/icons/Icons';
import { QuestionBookmark } from 'client/ui/icons/QuestionBookmark';
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

/* Day parity context — used for alternating row backgrounds by date group */

export const DayParityContext = React.createContext<Record<number, number>>({});

/** Compute a map of expense ID → 0 or 1 parity, toggling on each date change */
export function computeDayParities(expenses: UserExpense[]): Record<number, number> {
  const result: Record<number, number> = {};
  let parity = 0;
  let lastDate = '';
  for (const e of expenses) {
    if (e.date !== lastDate && lastDate !== '') {
      parity = 1 - parity;
    }
    lastDate = e.date;
    result[e.id] = parity;
  }
  return result;
}

/* Table — Mantine Table with fixed layout */

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

/* Row — uses Mantine Table.Tr */

export const Row = Table.Tr;

/* Column components — thin wrappers around Table.Td with Mantine style props.
 * Widths are set by the header (ExpenseHeader.tsx).
 * Responsive hiding uses CSS classes from bookkeeper.css. */

interface ColumnProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  colSpan?: number;
}

const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export const DateColumn: React.FC<ColumnProps> = props => (
  <Table.Td ta="right" pos="relative" className={cx('col-date', props.className)} {...props} />
);

export const AvatarColumn: React.FC<ColumnProps> = props => (
  <Table.Td px={8} pt={2} style={{ overflow: 'visible' }} {...props} />
);

export const NameColumn: React.FC<ColumnProps> = props => (
  <Table.Td pos="relative" pl={4} {...props} />
);

export const ReceiverColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td className={cx('hide-on-mobile-portrait', className)} {...props} />
);

export const CategoryColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td className={cx('hide-on-mobile-portrait', className)} {...props} />
);

export const SourceColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td p={4} className={cx('hide-on-mobile', className)} {...props} />
);

export const SumColumn: React.FC<ColumnProps> = props => (
  <Table.Td ta="right" pr={8} pos="relative" {...props} />
);

export const BalanceColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td
    ta="right"
    pr={8}
    pos="relative"
    className={cx('hide-on-mobile', className)}
    {...props}
  />
);

export const ToolColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td ta="right" className={cx('col-tools', className)} {...props} />
);

/* AllColumns — spans all visible columns (uses BaconJS for responsive colspan) */

interface AllColumnsProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  size: Size;
}

const AllColumnsComponent: React.FC<AllColumnsProps> = ({ size, ...props }) => (
  <Table.Td colSpan={getVisibleColumns(size)} {...props} />
);

export const AllColumns = connect(windowSizeP.map(size => ({ size })))(AllColumnsComponent);

/* Recurring expense icon — simple inline indicator */

export const RecurringExpenseIcon: React.FC = () => (
  <Box display="inline-flex" title="Toistuva kirjaus">
    <Icons.Recurring style={{ width: 16, height: 16, color: 'var(--mantine-color-primary-5)' }} />
  </Box>
);

export const IconToolArea: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Box pos="absolute" top={0} right={16} h={24} className="icon-tool-area">
    {children}
  </Box>
);

export const UnconfirmedIcon: React.FC<
  {
    size?: number;
    title?: string;
    onClick?: () => void;
  } & BoxProps
> = ({ size, title, onClick, style, ...props }) => (
  <Box title={title} onClick={onClick} style={{ ...style, cursor: 'pointer' }} {...props}>
    <QuestionBookmark size={size || 24} title={title ?? 'Alustava kirjaus'} />
  </Box>
);

/* Special rows */

export const RecurringExpenseSeparator: React.FC = () => (
  <Row>
    <AllColumns style={{ backgroundColor: 'var(--mantine-color-neutral-1)', height: 24 }} />
  </Row>
);

export const LoadingIndicator: React.FC<{ forRow?: boolean }> = ({ forRow }) => (
  <Row>
    <AllColumns>
      {forRow ? (
        <Center h={30}>
          <Loader size={30} />
        </Center>
      ) : (
        <Box pos="absolute" left="50%" top="50%">
          <Loader size={60} />
        </Box>
      )}
    </AllColumns>
  </Row>
);
