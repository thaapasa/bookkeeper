import * as React from 'react';
import styled from 'styled-components';
import { colorScheme } from '../Colors';
import { media } from '../Styles';
import { QuestionBookmark, Recurring } from '../Icons';
import RefreshIndicator from 'material-ui/RefreshIndicator';

const tableBgColor = colorScheme.primary.light;
const separatorColor = colorScheme.gray.standard;

export const ExpenseTableLayout = styled.table`
  width: 100%;
  background-color: ${tableBgColor};
  border-spacing: 0;
  table-layout: fixed;
`;

export const Row = styled.tr`
  padding: 0;
  &:first-of-type {
    td, th { border-top: none; }
  }
  &:last-of-type {
    td, th { border-bottom: 1px solid ${separatorColor}; }
  }
  td {
    border-top: 1px solid ${separatorColor};
    border-collapse: collapse;
  }
`;

const Column = styled.td`
  padding: 0;
  text-align: left;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;

  &.gray {
    background-color: ${colorScheme.gray.light};
  }
`;

const OptionalColumn = Column.extend`
  ${media.small`
    display: none;
    visibility: collapse;
      width: 0;
  `}
`;

const textColWidth = '20%';

export const DateColumn = Column.extend`
  text-align: right;
  width: 40px;
  position: relative;
`;
export const AvatarColumn = Column.extend`
  padding: 0 8px;
  padding-top: 2px;
  width: 32px;
`;
export const NameColumn = Column.extend`
  position: relative;
  padding-left: 4px;
  width: ${textColWidth};
  ${media.small`
    width: 100%;
  `}
`;
export const ReceiverColumn = OptionalColumn.extend`
  width: ${textColWidth};
`;
export const CategoryColumn = OptionalColumn.extend`
  width: ${textColWidth};
`;
export const sourceWidth = 52;
export const SourceColumn = OptionalColumn.extend`
  padding: 4px;
  padding-bottom: 0;
  width: ${sourceWidth + 8}px;
`;
const MoneyColumn = Column.extend`
  position: relative;
  width: 80px;
  text-align: right;
  padding-right: 8px;
`;
const OptMoneyColumn = OptionalColumn.extend`
  position: relative;
  width: 80px;
  text-align: right;
  padding-right: 8px;
`;
export const SumColumn = MoneyColumn.extend`
  &.income {
    background-color: ${colorScheme.primary.standard};
  }
  &.income:before {
    content: '+';
    position: absolute;
    left: 8px;
    color: ${colorScheme.secondary.standard};
  }
`;
export const BalanceColumn = OptMoneyColumn;
export const ToolColumn = Column.extend`
  width: 100px;
  text-align: right;
  ${media.small`
    width: 33px;
  `}
`;

export function AllColumns(props: { className?: string, children?: any }) {
  return <Column colSpan={9} className={props.className}>{props.children}</Column>;
}

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
`;

const recurringIconStyle = { width: 20, height: 20, color: colorScheme.secondary.light };
export function RecurringExpenseIcon() {
  return (
    <Corner title="Toistuva kirjaus"><Recurring style={recurringIconStyle} /></Corner>
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
    <UnconfirmedIconArea title="Alustava kirjaus"><QuestionBookmark size={size || 24} /></UnconfirmedIconArea>
  );
}

const RecurringExpenseSeparatorItem = styled(AllColumns)`
  background-color: ${colorScheme.gray.light};
  height: 24px;
`;

export function RecurringExpenseSeparator() {
  return <Row><RecurringExpenseSeparatorItem /></Row>;
}

export function LoadingIndicator(props: { forRow?: boolean }) {
  const forRow = !!props.forRow;
  return (
    <Row>
      <AllColumns>
        <RefreshIndicatorContainer className={forRow ? 'row' : 'primary'}>
          <RefreshIndicator left={forRow ? 16 : -30} top={forRow ? 0 : -30} status="loading" size={forRow ? 30 : 60} />
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
