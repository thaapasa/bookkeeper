import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip'
import ExpenseRow from './expense-row';
import { ExpenseHeader } from './expense-row';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import Money from '../../../shared/util/money';
import * as moment from 'moment';
import { MonthlyStatus } from './monthly-status';
import { UserExpense, ExpenseStatus, Expense } from '../../../shared/types/expense';
import { ExpenseTotals, ExpenseFilter, ExpenseFilterFunction } from './expense-helper';

interface ExpenseTableProps {
    date: moment.Moment;
    expenses: UserExpense[];
    loading: boolean;
    startStatus: ExpenseStatus;
    endStatus: ExpenseStatus;
    monthStatus: ExpenseStatus;
    unconfirmedBefore: boolean;
    onUpdateExpense: (expenseId: number, expense: UserExpense) => void;
}

interface ExpenseTableState {
    filters: ExpenseFilter[];
}

// TODO: tänne myös expensejen ja incomen total laskettuna!
export default class ExpenseTable extends React.Component<ExpenseTableProps, ExpenseTableState> {

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
            <ExpenseRow expense={expense}
                key={'expense-row-' + expense.id}
                addFilter={this.addFilter}
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
                        style={{margin: '0.3em', padding: 0}}
                        onRequestDelete={() => this.removeFilter(index)}>
                        {f.avatar ? <Avatar src={f.avatar}/> : null}
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
        const filtered = this.getFilteredExpenses();
        return <div className="expense-table bk-table">
            <ExpenseHeader className="expense-table-header bk-table-header fixed-horizontal"/>
            <div className="expense-data-area bk-table-data-area">
                {this.renderFilterRow()}
                {this.renderContents()}
            </div>
            <MonthlyStatus 
                unconfirmedBefore={this.props.unconfirmedBefore} 
                startStatus={this.props.startStatus} 
                monthStatus={this.props.monthStatus}
                endStatus={this.props.endStatus}
                totals={this.calculateTotals(this.props.expenses)}
                showFiltered={(this.state.filters.length > 0)}
                filteredTotals={this.calculateTotals(this.getFilteredExpenses())}    
            />
        </div>
    }
}
