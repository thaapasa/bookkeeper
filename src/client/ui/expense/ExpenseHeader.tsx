import * as React from 'react';
import { colorScheme } from '../Colors';
import { ExpenseRowContainer } from './ExpenseHelper';

export default function ExpenseHeader() {
  return (
    <Header>
      <div className="expense-detail date">Pvm</div>
      <div className="expense-detail user optional" />
      <div className="expense-detail title">Nimi</div>
      <div className="expense-detail receiver optional">Kohde</div>
      <div className="expense-detail category optional">Kategoria</div>
      <div className="expense-detail source optional">Lähde</div>
      <div className="expense-detail sum">Summa</div>
      <div className="expense-detail balance optional">Balanssi</div>
      <div className="expense-detail tools" />
    </Header>
  );
}

const Header = ExpenseRowContainer.extend`
  border-top: none;
  color: ${colorScheme.secondary.dark};
  font-weight: bold;
`;
