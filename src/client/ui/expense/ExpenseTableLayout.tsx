import * as React from 'react';
import styled from 'styled-components';
import { colorScheme } from '../Colors';
import { media } from '../Styles';
import { Recurring } from '../Icons';

const tableBgColor = colorScheme.primary.light;
const separatorColor = colorScheme.gray.standard;

export const ExpenseTableLayout = styled.table`
  width: 100%;
  background-color: ${tableBgColor};
  border-spacing: 0;
  table-layout: fixed;
`;

export const Row = styled.tr``;

const Column = styled.td`
  text-align: left;
  border-bottom: 1px solid ${separatorColor};
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const OptionalColumn = Column.extend`
  ${media.small`
    display: none;
    visibility: collapse;
    width: 0;
  `}
`;

const textColWidth = '20%';

const recurringIconStyle = { width: 20, height: 20, color: colorScheme.secondary.light };
export function RecurringExpenseIcon() {
  return (
    <Corner><Recurring style={recurringIconStyle} /></Corner>
  );
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

export const DateColumn = Column.extend`
  text-align: right;
  width: 40px;
  position: relative;
`;
export const AvatarColumn = Column.extend`
  padding: 0 8px;
  padding-top: 1px;
  width: 32px;
`;
export const NameColumn = Column.extend`
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
export const SourceColumn = OptionalColumn.extend`
  width: 40px;
`;
export const SumColumn = Column.extend`
  width: 72px;
  text-align: right;
`;
export const BalanceColumn = OptionalColumn.extend`
  width: 72px;
  text-align: right;
`;
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

const RecurringExpenseSeparatorItem = styled(AllColumns)`
  background-color: ${colorScheme.gray.light};
  height: 24px;
`;

export function RecurringExpenseSeparator() {
  return <Row><RecurringExpenseSeparatorItem /></Row>;
}
