import styled from '@emotion/styled';
import { Box, Center, Loader, Table } from '@mantine/core';
import * as React from 'react';

import { windowSizeP } from 'client/data/State';
import { primary } from 'client/ui/Colors';
import { connect } from 'client/ui/component/BaconConnect';
import { Icons } from 'client/ui/icons/Icons';
import { QuestionBookmark } from 'client/ui/icons/QuestionBookmark';
import { getScreenSizeClassName, ScreenSizeClassName, Size } from 'client/ui/Styles';

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

/* Table — Mantine Table with fixed layout */

export const ExpenseTableLayout: React.FC<
  React.PropsWithChildren<{ loading?: boolean; padded?: boolean; className?: string }>
> = ({ loading, padded, className, children }) => (
  <Table
    layout="fixed"
    withRowBorders
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

/* Row — uses Mantine Table.Tr; .first-day class is in bookkeeper.css */

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

export const AvatarColumn: React.FC<ColumnProps> = props => <Table.Td px={8} pt={2} {...props} />;

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

/* Custom overlay components (genuinely need custom CSS) */

const Corner = styled.div`
  position: absolute;
  top: -32px;
  left: -31px;
  width: 50px;
  height: 50px;
  padding-top: 18px;
  background-color: var(--mantine-color-neutral-1);
  transform: rotate(45deg);
  z-index: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
`;

export const RecurringExpenseIcon: React.FC = () => (
  <Corner title="Toistuva kirjaus">
    <Icons.Recurring style={{ width: 20, height: 20, color: primary[2] }} />
  </Corner>
);

export const IconToolArea = styled.div`
  position: absolute;
  top: 0;
  right: 16px;
  height: 24px;
  & > svg,
  & > div {
    margin-left: 4px;
  }
`;

const IconContainer = styled.div`
  cursor: pointer;
  position: relative;
  display: inline-block;
`;

export const UnconfirmedIcon: React.FC<{
  size?: number;
  title?: string;
  onClick?: () => void;
}> = ({ size, title, onClick }) => (
  <IconContainer title={title} onClick={onClick}>
    <QuestionBookmark size={size || 24} title={title ?? 'Alustava kirjaus'} />
  </IconContainer>
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
