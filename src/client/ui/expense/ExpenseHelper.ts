import styled from 'styled-components';
import Money, { MoneyLike } from '../../../shared/util/Money';
import { ExpenseStatus, ExpenseData } from '../../../shared/types/Expense';
import { colorScheme } from '../Colors';

export function expenseName(e: ExpenseData): string {
  return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}

export function money(v?: MoneyLike): string {
  return v ? Money.from(v).format() : '-';
}

export interface ExpenseTotals {
  totalExpense: MoneyLike;
  totalIncome: MoneyLike;
}

export const zeroStatus: ExpenseStatus = {
  balance: 0,
  benefit: 0,
  cost: 0,
  income: 0,
  split: 0,
  value: 0,
};

export const ExpenseRowContainer = styled.div`
  position: relative;
  height: 41px !important;
  display: flex;
  border-top: 1px solid ${colorScheme.gray.standard};
  background-color: ${colorScheme.primary.light};
  white-space: nowrap;
  align-items: center;
`;
