import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip'
import ExpenseRow from './expense-row';
import { ExpenseHeader } from './expense-row';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import Money from '../../../shared/util/money';
import * as moment from 'moment';
import { MonthlyStatus } from './monthly-status';

interface ExpenseTableProps {
    date: moment.Moment;
    expenses: any[];
    loading: boolean;
    startStatus: any;
    endStatus: any;
    monthStatus: any;
    unconfirmedBefore: boolean;
    onUpdateExpense: any;
}

interface ExpenseTableState {
    details: any;
    filters: any[];
}

// TODO: tänne myös expensejen ja incomen total laskettuna!
export default class ExpenseTable extends React.Component<ExpenseTableProps, ExpenseTableState> {

    public state: ExpenseTableState = {
        details: {},
        filters: [],
    };

    private addFilter = (fun, name, avatar) => {
        this.setState(s => ({
            filters: s.filters.concat({ filter: fun, name: name, avatar: avatar })
        }));
    }

    private removeFilter = (index) => {
        this.setState(s => {
            s.filters.splice(index, 1);
            return s;
        });
    }

    private getFilteredExpenses = () => {
        return this.props.expenses ? this.state.filters.reduce((a, b) => a.filter(b.filter), this.props.expenses) : [];
    }

    private renderExpense = (expense) => {
        return (
            <ExpenseRow expense={ expense }
                key={ "expense-row-" + expense.id }
                addFilter={ this.addFilter }
                onUpdated={ e => this.props.onUpdateExpense(expense.id, e) } />
        );
    }

    private calculateTotals(expenses: any[]) {
        if (expenses.length < 1) return null;
        const income = expenses.filter(e => e.type === "income").reduce((s, c) => s.plus(c.sum), Money.zero);
        const expense = expenses.filter(e => e.type === "expense").reduce((s, c) => s.plus(c.sum), Money.zero);
        return {totalIncome: income, totalExpense: expense}
    }

    public render() {
        const filtered = this.getFilteredExpenses();
        return <div className="expense-table bk-table">
            <ExpenseHeader className="expense-table-header bk-table-header fixed-horizontal"/>
            <div className="expense-data-area bk-table-data-area">
                { this.props.loading ?
                    <div className="loading-indicator-big"><RefreshIndicator left={-30} top={-30} status="loading" size={60} /></div> :
                    (this.state.filters.length > 0 ?
                        [ <div className="expense-row bk-table-row" key="filters">
                            <div className="expense-filters">{
                                this.state.filters.map((f, index) => <Chip
                                    key={index}
                                    style={{margin: "0.3em", padding: 0}}
                                    onRequestDelete={() => this.removeFilter(index)}>
                                    { f.avatar ? <Avatar src={f.avatar}/> : null }
                                    { f.name }
                                </Chip>)
                            }</div>
                        </div> ]
                        : []).concat(filtered.map(this.renderExpense))
                }
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
