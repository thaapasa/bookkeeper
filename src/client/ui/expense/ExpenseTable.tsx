import * as React from 'react';
import styled from 'styled-components';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import ExpenseRow from './ExpenseRow';
import ExpenseHeader from './ExpenseHeader';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import Money from '../../../shared/util/Money';
import { MonthlyStatus } from './MonthlyStatus';
import { UserExpense, ExpenseStatus, Expense } from '../../../shared/types/Expense';
import { ExpenseTotals, ExpenseFilter, ExpenseFilterFunction } from './ExpenseHelper';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from '../../data/Categories';
import { colorScheme } from '../Colors';

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

  private renderExpense = (expense: UserExpense) => {
    return (
      <ExpenseRow
        expense={expense}
        userData={this.props.userData}
        key={'expense-row-' + expense.id}
        addFilter={this.addFilter}
        // tslint:disable-next-line jsx-no-lambda
        onUpdated={e => this.props.onUpdateExpense(expense.id, e)} />
    );
  }

  private calculateTotals(expenses: Expense[]): ExpenseTotals | null {
    if (expenses.length < 1) { return null; }
    const income = expenses.filter(e => e.type === 'income').reduce((s, c) => s.plus(c.sum), Money.zero);
    const expense = expenses.filter(e => e.type === 'expense').reduce((s, c) => s.plus(c.sum), Money.zero);
    return { totalIncome: income, totalExpense: expense };
  }

  private renderFilterRow() {
    if (this.state.filters.length === 0) { return null; }
    return (
      <div className="expense-row bk-table-row" key="filters">
        <div className="expense-filters">{
          this.state.filters.map((f, index) => <Chip
            key={index}
            style={{ margin: '0.3em', padding: 0 }}
            // tslint:disable-next-line jsx-no-lambda
            onRequestDelete={() => this.removeFilter(index)}>
            {f.avatar ? <Avatar src={f.avatar} /> : null}
            {f.name}
          </Chip>)
        }</div>
      </div>
    );
  }

  private renderLoadingIndicator() {
    return (
      <div className="loading-indicator-big">
        <RefreshIndicator left={-30} top={-30} status="loading" size={60} />
      </div>
    );
  }

  private renderContents() {
    if (this.props.loading) { return this.renderLoadingIndicator(); }
    const filtered = this.getFilteredExpenses();
    return filtered.map(this.renderExpense);
  }

  public render() {
    return (
      <ExpenseTableContainer>
        <ExpenseHeader />
        <ExpenseDataArea>
          {this.renderFilterRow()}
          {this.renderContents()}
        </ExpenseDataArea>
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

const ExpenseTableContainer = styled.div`
  font-size: 13px;
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
`;

const ExpenseDataArea = styled.div`
  flex: 1;
  width: 100%;
  background-color: ${colorScheme.gray.light};
  overflow-y: auto;
  overflow-x: hidden;
`;
