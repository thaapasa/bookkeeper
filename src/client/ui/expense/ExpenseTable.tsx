import { styled } from '@mui/material';
import * as React from 'react';

import { Expense, ExpenseStatus, UserExpense } from 'shared/expense';
import { Money, partition } from 'shared/util';
import { userDataE, UserDataProps } from 'client/data/Categories';

import { colorScheme } from '../Colors';
import { connect } from '../component/BaconConnect';
import { ListDecorator } from '../component/ListDecorator';
import { media, PageContentContainer } from '../Styles';
import { ExpenseTotals } from './ExpenseHelper';
import { MonthlyStatus } from './MonthlyStatus';
import { ExpenseFilterRow } from './row/ExpenseFilterRow';
import { ExpenseFilter, ExpenseFilterFunction } from './row/ExpenseFilters';
import { ExpenseHeader } from './row/ExpenseHeader';
import { CommonExpenseRowProps, ExpenseRow } from './row/ExpenseRow';
import { ExpenseRowSeparator } from './row/ExpenseRowSeparator';
import {
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
  dateBorder?: boolean;
}

interface ExpenseTableState {
  filters: ExpenseFilter[];
  recurringExpanded: boolean;
}

// TODO: tänne myös expensejen ja incomen total laskettuna!
class ExpenseTable extends React.Component<
  ExpenseTableProps,
  ExpenseTableState
> {
  public state: ExpenseTableState = {
    filters: [],
    recurringExpanded: false,
  };

  private addFilter = (
    filter: ExpenseFilterFunction,
    name: string,
    avatar?: string
  ) => {
    this.setState(s => ({
      filters: s.filters.concat({ filter, name, avatar }),
    }));
  };

  private removeFilter = (index: number) => {
    this.setState(s => {
      s.filters.splice(index, 1);
      return s;
    });
  };

  private getFilteredExpenses = (): UserExpense[] => {
    return this.props.expenses
      ? this.state.filters.reduce(
          (a, b) => a.filter(b.filter),
          this.props.expenses
        )
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

  private toggleRecurring = () =>
    this.setState(s => ({ recurringExpanded: !s.recurringExpanded }));

  private renderRecurringExpenses(recurring: UserExpense[]) {
    return (
      <React.Fragment>
        <RecurringSummaryRow
          recurring={recurring}
          onToggle={this.toggleRecurring}
          isExpanded={this.state.recurringExpanded}
          addFilter={this.addFilter}
        />
        {this.state.recurringExpanded
          ? recurring.map(this.renderExpense)
          : null}
      </React.Fragment>
    );
  }

  private renderExpenseRows() {
    if (this.props.loading && this.props.expenses.length < 1) {
      return <LoadingIndicator />;
    }
    const filtered = this.getFilteredExpenses();
    const [recurring, normal] = partition(
      e => !!e.recurringExpenseId,
      filtered
    );
    if (recurring.length < 1) {
      return normal.map(this.renderExpense);
    } else if (normal.length < 1) {
      return this.renderRecurringExpenses(recurring);
    }
    return (
      <>
        {this.renderRecurringExpenses(recurring)}
        <RecurringExpenseSeparator />
        <ListDecorator
          items={normal}
          itemRenderer={ExpenseItem}
          userData={this.props.userData}
          addFilter={this.addFilter}
          onUpdated={this.onUpdateExpense}
          separator={ExpenseRowSeparator}
          itemKey={expenseToKey}
          dateBorder={this.props.dateBorder}
        />
      </>
    );
  }

  public render() {
    return (
      <PageContentContainer>
        <ExpenseArea>
          <ExpenseTableLayout className={this.props.loading ? 'loading' : ''}>
            <thead>
              <ExpenseHeader />
              <ExpenseFilterRow
                filters={this.state.filters}
                onRemoveFilter={this.removeFilter}
              />
            </thead>
            <tbody>{this.renderExpenseRows()}</tbody>
          </ExpenseTableLayout>
          <ExpenseFiller />
        </ExpenseArea>
        <MonthlyStatus
          {...this.props}
          unconfirmedDuring={
            this.props.expenses.find(e => !e.confirmed) !== undefined
          }
          addFilter={this.addFilter}
          totals={this.calculateTotals(this.props.expenses)}
          showFiltered={this.state.filters.length > 0}
          filteredTotals={this.calculateTotals(this.getFilteredExpenses())}
        />
      </PageContentContainer>
    );
  }
}

export default connect(userDataE.map(userData => ({ userData })))(ExpenseTable);

const ExpenseItem: React.FC<
  {
    item: UserExpense;
    userData: UserDataProps;
    prev: UserExpense | null;
    dateBorder?: boolean;
  } & Omit<CommonExpenseRowProps, 'expense'>
> = ({ item, ...props }) => <ExpenseRow expense={item} {...props} />;

const ExpenseArea = styled('div')`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  white-space: nowrap;
  align-items: center;
  background-color: ${colorScheme.primary.light};
  padding: 0 16px;
  display: flex;
  flex-direction: column;

  ${media.mobile`
    padding: 0;
  `}
`;

const ExpenseFiller = styled('div')`
  width: 100%;
  flex: 1;
  background-color: ${colorScheme.gray.light};
`;

function expenseToKey(e: Expense) {
  return String(e.id);
}
