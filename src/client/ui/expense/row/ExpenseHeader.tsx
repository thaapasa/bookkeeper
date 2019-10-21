import * as React from 'react';
import {
  Row,
  DateColumn,
  AvatarColumn,
  NameColumn,
  ReceiverColumn,
  CategoryColumn,
  SourceColumn,
  SumColumn,
  BalanceColumn,
  ToolColumn,
} from './ExpenseTableLayout';

export default function ExpenseHeader() {
  return (
    <Row>
      <DateColumn as="th">Pvm</DateColumn>
      <AvatarColumn as="th" />
      <NameColumn as="th">Nimi</NameColumn>
      <ReceiverColumn as="th">Kohde</ReceiverColumn>
      <CategoryColumn as="th">Kategoria</CategoryColumn>
      <SourceColumn as="th">Lähde</SourceColumn>
      <SumColumn as="th">Summa</SumColumn>
      <BalanceColumn as="th">Balanssi</BalanceColumn>
      <ToolColumn as="th" />
    </Row>
  );
}
