import { Box, Table } from '@mantine/core';
import * as React from 'react';

import { Expense, ExpenseStatus, UserExpense } from 'shared/expense';
import { Money, partition } from 'shared/util';
import { userDataP, UserDataProps } from 'client/data/Categories';

import { connect } from '../component/BaconConnect';
import { ListDecorator } from '../component/ListDecorator';
import { ExpenseTotals } from './ExpenseHelper';
import { MonthlyStatus } from './MonthlyStatus';
import { ExpenseFilterRow } from './row/ExpenseFilterRow';
import { ExpenseFilter, ExpenseFilterFunction } from './row/ExpenseFilters';
import { ExpenseHeader } from './row/ExpenseHeader';
import { CommonExpenseRowProps, ExpenseRow } from './row/ExpenseRow';
import { ExpenseRowSeparator } from './row/ExpenseRowSeparator';
import {
  computeDayParities,
  DayParityContext,
  ExpenseTableLayout,
  LoadingIndicator,
  RecurringExpenseSeparator,
} from './row/ExpenseTableLayout';
import { RecurringSummaryRow } from './row/RecurringSummaryRow';

interface ExpenseTableProps {
  expenses: UserExpense[];
  loading: boolean;
  startStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  monthStatus: ExpenseStatus;
  unconfirmedBefore: boolean;
  onUpdateExpense: (expenseId: number, expense: UserExpense) => void;
  userData: UserDataProps;
}

interface ExpenseTableState {
  filters: ExpenseFilter[];
  recurringExpanded: boolean;
}

// TODO: tänne myös expensejen ja incomen total laskettuna!
class ExpenseTable extends React.Component<ExpenseTableProps, ExpenseTableState> {
  public state: ExpenseTableState = {
    filters: [],
    recurringExpanded: false,
  };

  private addFilter = (filter: ExpenseFilterFunction, name: string) => {
    this.setState(s => ({
      filters: s.filters.concat({ filter, name }),
    }));
  };

  private removeFilter = (index: number) => {
    this.setState(s => ({
      filters: s.filters.filter((_, i) => i !== index),
    }));
  };

  private getFilteredExpenses = (): UserExpense[] => {
    return this.props.expenses
      ? this.state.filters.reduce((a, b) => a.filter(b.filter), this.props.expenses)
      : [];
  };

  private onUpdateExpense = (e: UserExpense) => {
    this.props.onUpdateExpense(e.id, e);
  };

  private renderExpense = (expense: UserExpense) => {
    return (
      <ExpenseRow
        expense={expense}
        userData={this.props.userData}
        key={'expense-row-' + expense.id}
        addFilter={this.addFilter}
        onUpdated={this.onUpdateExpense}
      />
    );
  };

  private calculateTotals(expenses: Expense[]): ExpenseTotals | null {
    if (expenses.length < 1) {
      return null;
    }
    const income = expenses
      .filter(e => e.type === 'income')
      .reduce((s, c) => s.plus(c.sum), Money.zero);
    const expense = expenses
      .filter(e => e.type === 'expense')
      .reduce((s, c) => s.plus(c.sum), Money.zero);
    return { totalIncome: income, totalExpense: expense };
  }

  private toggleRecurring = () => this.setState(s => ({ recurringExpanded: !s.recurringExpanded }));

  private renderRecurringExpenses(recurring: UserExpense[]) {
    return (
      <React.Fragment>
        <RecurringSummaryRow
          recurring={recurring}
          onToggle={this.toggleRecurring}
          isExpanded={this.state.recurringExpanded}
          addFilter={this.addFilter}
        />
        {this.state.recurringExpanded ? recurring.map(this.renderExpense) : null}
      </React.Fragment>
    );
  }

  private renderExpenseRows() {
    if (this.props.loading && this.props.expenses.length < 1) {
      return <LoadingIndicator />;
    }
    const filtered = this.getFilteredExpenses();
    const [recurring, normal] = partition(e => !!e.recurringExpenseId, filtered);
    if (recurring.length < 1) {
      const dayParities = computeDayParities(normal);
      return (
        <DayParityContext.Provider value={dayParities}>
          <ListDecorator
            items={normal}
            itemRenderer={ExpenseItem}
            userData={this.props.userData}
            addFilter={this.addFilter}
            onUpdated={this.onUpdateExpense}
            separator={ExpenseRowSeparator}
            itemKey={expenseToKey}
          />
        </DayParityContext.Provider>
      );
    } else if (normal.length < 1) {
      return this.renderRecurringExpenses(recurring);
    }
    const dayParities = computeDayParities(normal);
    return (
      <>
        {this.renderRecurringExpenses(recurring)}
        <RecurringExpenseSeparator />
        <DayParityContext.Provider value={dayParities}>
          <ListDecorator
            items={normal}
            itemRenderer={ExpenseItem}
            userData={this.props.userData}
            addFilter={this.addFilter}
            onUpdated={this.onUpdateExpense}
            separator={ExpenseRowSeparator}
            itemKey={expenseToKey}
          />
        </DayParityContext.Provider>
      </>
    );
  }

  public render() {
    return (
      <Box style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>
        <Box px={{ base: 0, sm: 16 }} style={{ whiteSpace: 'nowrap' }}>
          <ExpenseTableLayout loading={this.props.loading}>
            <Table.Thead>
              <ExpenseHeader />
              <ExpenseFilterRow filters={this.state.filters} onRemoveFilter={this.removeFilter} />
            </Table.Thead>
            <Table.Tbody>{this.renderExpenseRows()}</Table.Tbody>
          </ExpenseTableLayout>
        </Box>
        <Box
          flex={1}
          mx={{ base: 0, sm: 16 }}
          style={{
            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-9))',
          }}
        />
        <MonthlyStatus
          {...this.props}
          unconfirmedDuring={this.props.expenses.find(e => !e.confirmed) !== undefined}
          addFilter={this.addFilter}
          totals={this.calculateTotals(this.props.expenses)}
          showFiltered={this.state.filters.length > 0}
          filteredTotals={this.calculateTotals(this.getFilteredExpenses())}
        />
      </Box>
    );
  }
}

export default connect(userDataP.map(userData => ({ userData })))(ExpenseTable);

const ExpenseItem: React.FC<
  {
    item: UserExpense;
    userData: UserDataProps;
    prev: UserExpense | null;
  } & Omit<CommonExpenseRowProps, 'expense'>
> = ({ item, ...props }) => <ExpenseRow expense={item} {...props} />;

function expenseToKey(e: Expense) {
  return String(e.id);
}
