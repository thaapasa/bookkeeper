import { CircularProgress } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { windowSizeP } from 'client/data/State';
import { colorScheme } from 'client/ui/Colors';
import { connect } from 'client/ui/component/BaconConnect';
import { QuestionBookmark, Recurring } from 'client/ui/Icons';
import {
  getScreenSizeClassName,
  media,
  ScreenSizeClassName,
} from 'client/ui/Styles';
import { Size } from 'client/ui/Types';

const tableBgColor = colorScheme.primary.light;
const separatorColor = colorScheme.gray.standard;

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
type ExpenseRowColumns = typeof columns[number];

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
  'mobile-portrait': columns.filter(c => columnSizes[c] === 'mobile-portrait')
    .length,
  'mobile-landscape': columns.filter(
    c =>
      columnSizes[c] === 'mobile-portrait' ||
      columnSizes[c] === 'mobile-landscape'
  ).length,
  web: columns.length,
  large: columns.length,
};

export function getVisibleColumns(windowSize: Size) {
  const size = getScreenSizeClassName(windowSize);
  return maxColumnsForSize[size];
}

export const ExpenseTableLayout = styled.table`
  width: 100%;
  background-color: ${tableBgColor};
  border-spacing: 0;
  table-layout: fixed;
  &.padding {
    padding: 0 16px;
  }

  &.loading > tbody {
    filter: opacity(40%);
  }
`;

export const Row = styled.tr`
  padding: 0;
  width: 100%;
  &:first-of-type {
    td,
    th {
      border-top: none;
    }
  }
  &:last-of-type {
    td,
    th {
      border-bottom: 1px solid ${separatorColor};
    }
  }
  td {
    border-top: 1px solid ${separatorColor};
    border-collapse: collapse;
  }
`;

export const rowHeight = 40;

const Column = styled.td`
  padding: 0;
  text-align: left;
  height: ${rowHeight}px;
  overflow: hidden;
  text-overflow: ellipsis;

  &.gray {
    background-color: ${colorScheme.gray.light};
  }
  &.dark {
    background-color: ${colorScheme.secondary.dark};
  }
`;

const WebColumn = styled(Column)`
  ${media.mobile`
    display: none;
    width: 0;
  `}
`;

const MobileLandscapeColumn = styled(Column)`
  ${media.mobilePortrait`
    display: none;
    width: 0;
  `}
`;

export const DateColumn = styled(Column)`
  text-align: right;
  width: 60px;
  position: relative;

  ${media.mobile`
    width: 40px;
  `}
`;
export const AvatarColumn = styled(Column)`
  padding: 0 8px;
  padding-top: 2px;
  width: 32px;
`;
export const NameColumn = styled(Column)`
  position: relative;
  padding-left: 4px;
`;
export const ReceiverColumn = MobileLandscapeColumn;
export const CategoryColumn = MobileLandscapeColumn;

export const sourceWidth = 52;
export const SourceColumn = styled(WebColumn)`
  padding: 4px;
  padding-bottom: 0;
  width: ${sourceWidth + 8}px;
`;
const MoneyColumn = styled(Column)`
  position: relative;
  width: 80px;
  text-align: right;
  padding-right: 8px;
`;
const OptMoneyColumn = styled(WebColumn)`
  position: relative;
  width: 80px;
  text-align: right;
  padding-right: 8px;
`;
export const SumColumn = styled(MoneyColumn)`
  width: 100px;
  &.income {
    background-color: ${colorScheme.primary.standard};
  }
`;
export const BalanceColumn = OptMoneyColumn;
export const ToolColumn = styled(Column)`
  width: 100px;
  text-align: right;
  white-space: nowrap;
  ${media.mobile`
    width: 33px;
    overflow: hidden;
  `}
`;

const AllColumnsComponent: React.FC<
  React.PropsWithChildren<{ className?: string; size: Size }>
> = ({ className, children, size }) => (
  <Column colSpan={getVisibleColumns(size)} className={className}>
    {children}
  </Column>
);

export const AllColumns = connect(windowSizeP.map(size => ({ size })))(
  AllColumnsComponent
);

const Corner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  padding-top: 18px;
  background-color: ${colorScheme.gray.light};
  transform: rotate(45deg);
  top: -32px;
  left: -31px;
  z-index: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
`;

const recurringIconStyle = {
  width: 20,
  height: 20,
  color: colorScheme.secondary.light,
};
export function RecurringExpenseIcon() {
  return (
    <Corner title="Toistuva kirjaus">
      <Recurring style={recurringIconStyle} />
    </Corner>
  );
}

const UnconfirmedIconArea = styled.div`
  position: absolute;
  top: 0;
  right: 16px;
  width: 18px;
  height: 24px;
`;

export function UnconfirmedIcon({ size }: { size?: number }) {
  return (
    <UnconfirmedIconArea title="Alustava kirjaus">
      <QuestionBookmark size={size || 24} />
    </UnconfirmedIconArea>
  );
}

const RecurringExpenseSeparatorItem = styled(AllColumns)`
  background-color: ${colorScheme.gray.light};
  height: 24px;
`;

export function RecurringExpenseSeparator() {
  return (
    <Row>
      <RecurringExpenseSeparatorItem />
    </Row>
  );
}

const Progress = styled(CircularProgress)`
  &.row {
    left: 16px;
    top: 0;
    width: 30px;
    height: 30px;
  }
  &.primary {
    left: -30px;
    top: -30px;
    width: 60px;
    height: 60px;
  }
`;

export function LoadingIndicator(props: { forRow?: boolean }) {
  const className = props.forRow ? 'row' : 'primary';
  return (
    <Row>
      <AllColumns {...props}>
        <RefreshIndicatorContainer className={className}>
          <Progress className={className} />
        </RefreshIndicatorContainer>
      </AllColumns>
    </Row>
  );
}

const RefreshIndicatorContainer = styled.div`
  &.primary {
    position: absolute;
    left: 50%;
    top: 50%;
  }
  &.row {
    position: relative;
    width: 100%;
    text-align: center;
    height: 30px;
  }
`;
