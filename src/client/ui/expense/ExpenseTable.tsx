import * as React from 'react';
import styled from 'styled-components';
import ExpenseRow from './ExpenseRow';
import ExpenseHeader from './ExpenseHeader';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import Money from '../../../shared/util/Money';
import { MonthlyStatus } from './MonthlyStatus';
import { UserExpense, ExpenseStatus, Expense } from '../../../shared/types/Expense';
import { ExpenseTotals } from './ExpenseHelper';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from '../../data/Categories';
import ExpenseFilterRow, { ExpenseFilter, ExpenseFilterFunction } from './ExpenseFilterRow';
import { partition } from '../../../shared/util/Arrays';
import { ExpenseTableLayout, RecurringExpenseSeparator, AllColumns, Row } from './ExpenseTableLayout';
import { colorScheme } from '../Colors';
import { media } from '../Styles';

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
}

// TODO: tänne myös expensejen ja incomen total laskettuna!
class ExpenseTable extends React.Component<ExpenseTableProps, ExpenseTableState> {

  public state: ExpenseTableState = {
    filters: [],
  };

  private addFilter = (filter: ExpenseFilterFunction, name: string, avatar?: string) => {
    this.setState(s => ({
      filters: s.filters.concat({ filter, name, avatar }),
    }));
  }

  private removeFilter = (index: number) => {
    this.setState(s => {
      s.filters.splice(index, 1);
      return s;
    });
  }

  private getFilteredExpenses = (): UserExpense[] => {
    return this.props.expenses ? this.state.filters.reduce((a, b) => a.filter(b.filter), this.props.expenses) : [];
  }

  private onUpdateExpense = (e: UserExpense) => {
    this.props.onUpdateExpense(e.id, e);
  }

  private renderExpense = (expense: UserExpense) => {
    return (
      <ExpenseRow
        expense={expense}
        userData={this.props.userData}
        key={'expense-row-' + expense.id}
        addFilter={this.addFilter}
        onUpdated={this.onUpdateExpense} />
    );
  }

  private calculateTotals(expenses: Expense[]): ExpenseTotals | null {
    if (expenses.length < 1) { return null; }
    const income = expenses.filter(e => e.type === 'income').reduce((s, c) => s.plus(c.sum), Money.zero);
    const expense = expenses.filter(e => e.type === 'expense').reduce((s, c) => s.plus(c.sum), Money.zero);
    return { totalIncome: income, totalExpense: expense };
  }

  private renderExpenseRows() {
    if (this.props.loading) { return <LoadingIndicator />; }
    const filtered = this.getFilteredExpenses();
    const [recurring, normal] = partition(e => !!e.recurringExpenseId, filtered);
    if (recurring.length < 1) {
      return normal.map(this.renderExpense);
    } else if (normal.length < 1) {
      return recurring.map(this.renderExpense);
    }
    return (
      <React.Fragment>
        {recurring.map(this.renderExpense)}
        <RecurringExpenseSeparator />
        {normal.map(this.renderExpense)}
      </React.Fragment>
    );
  }

  public render() {
    return (
      <ExpenseTableContainer>
        <ExpenseArea>
          <ExpenseTableLayout>
            <thead>
              <ExpenseHeader />
              <ExpenseFilterRow filters={this.state.filters} onRemoveFilter={this.removeFilter} />
            </thead>
            <tbody>
              {this.renderExpenseRows()}
            </tbody>
          </ExpenseTableLayout>
        </ExpenseArea>
        <MonthlyStatus
          {...this.props}
          totals={this.calculateTotals(this.props.expenses)}
          showFiltered={(this.state.filters.length > 0)}
          filteredTotals={this.calculateTotals(this.getFilteredExpenses())}
        />
      </ExpenseTableContainer>
    );
  }
}

export default connect(userDataE.map(userData => ({ userData })))(ExpenseTable);

function LoadingIndicator() {
  return (
    <Row>
      <RefreshIndicatorContainer>
        <RefreshIndicator left={-30} top={-30} status="loading" size={60} />
      </RefreshIndicatorContainer>
    </Row>
  );
}

const ExpenseArea = styled.div`
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  white-space: nowrap;
  align-items: center;
  background-color: ${colorScheme.gray.light};
`;

const RefreshIndicatorContainer = styled(AllColumns)`
  position: absolute;
  left: 50%;
  top: 50%;
`;

const ExpenseTableContainer = styled.div`
  font-size: 13px;
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: ${colorScheme.primary.light};
  padding: 0 16px;

  ${media.small`
    padding: 0;
  `}
`;
