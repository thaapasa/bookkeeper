import * as React from 'react';
import { RecurringExpenseIcon, Row, DateColumn, AvatarColumn, NameColumn, ReceiverColumn, CategoryColumn, SourceColumn, SumColumn, BalanceColumn, ToolColumn } from './ExpenseTableLayout';
import { UserExpense } from '../../../shared/types/Expense';
import Money from '../../../shared/util/Money';
import { ExpandLess, ExpandMore } from '../Icons';

interface RecurringSummaryRowProps {
  recurring: UserExpense[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function RecurringSummaryRow(props: RecurringSummaryRowProps) {
  const sum = props.recurring.map(s => Money.from(s.sum)).reduce(Money.plus, Money.zero);
  const balance = props.recurring.map(s => Money.from(s.userBalance)).reduce(Money.plus, Money.zero);
  return (
    <Row>
      <DateColumn><RecurringExpenseIcon /></DateColumn>
      <AvatarColumn />
      <NameCol>Toistuvat ({props.recurring.length} kpl)</NameCol>
      <ReceiverColumn />
      <CategoryColumn />
      <SourceColumn />
      <SumColumn>{sum.format()}</SumColumn>
      <BalanceColumn>{balance.format()}</BalanceColumn>
      <ToolColumn>{props.isExpanded ? <ExpandLess onClick={props.onToggle} /> : <ExpandMore onClick={props.onToggle} />}</ToolColumn>
    </Row>
  );
}

const NameCol = NameColumn.extend`
  font-style: italic;
`;
