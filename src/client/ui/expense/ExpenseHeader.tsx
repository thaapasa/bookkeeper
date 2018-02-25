import * as React from 'react';
import { Row, DateColumn, AvatarColumn, NameColumn, ReceiverColumn, CategoryColumn, SourceColumn, SumColumn, BalanceColumn, ToolColumn } from './ExpenseTableLayout';

export default function ExpenseHeader() {
  return (
    <Row>
      <DateCol>Pvm</DateCol>
      <AvatarCol />
      <NameCol>Nimi</NameCol>
      <ReceiverCol>Kohde</ReceiverCol>
      <CategoryCol>Kategoria</CategoryCol>
      <SourceCol>Lähde</SourceCol>
      <SumCol>Summa</SumCol>
      <BalanceCol>Balanssi</BalanceCol>
      <ToolCol />
    </Row>
  );
}

const DateCol = DateColumn.withComponent('th');
const AvatarCol = AvatarColumn.withComponent('th');
const NameCol = NameColumn.withComponent('th');
const ReceiverCol = ReceiverColumn.withComponent('th');
const CategoryCol = CategoryColumn.withComponent('th');
const SourceCol = SourceColumn.withComponent('th');
const SumCol = SumColumn.withComponent('th');
const BalanceCol = BalanceColumn.withComponent('th');
const ToolCol = ToolColumn.withComponent('th');
