import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip'
import ExpenseRow from './expense-row';
import { ExpenseHeader, ExpenseStatus, ExpenseTotal } from './expense-row';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import Money from '../../shared/util/money';
import * as moment from 'moment';

function money(v) {
    return v ? Money.from(v).format() : "-";
}

interface StatusProps {
    unconfirmedBefore: boolean;
    startStatus: { balance: number };
    monthStatus: { balance: number };
    endStatus: { balance: number };
    totals: {totalExpense: any, totalIncome: any} | null;
    showFiltered: boolean;
    filteredTotals: {totalExpense: any, totalIncome: any} | null;
}

class MonthlyStatus extends React.Component<StatusProps, {}> {

    private getCalculationRow(title: string, sum: number, drawTopBorder: boolean) {
        const rowStyle = { borderTop: (drawTopBorder ? '1px solid rgb(224, 224, 224)' : 'none') }

        return <div className="calculation-row" style={rowStyle}>
                <div className="calculation-title">{title}</div>
                <div className="calculation-sum">{money(sum)}</div>
            </div>
    }

    public componentDidMount() {
        console.log(this.props);
        console.log(this.props.startStatus, this.props.monthStatus, this.props.endStatus);
    }

    public componentDidUpdate() {
        console.log(this.props.startStatus, this.props.monthStatus, this.props.endStatus);
    }

    public render() {
        const income = this.props.totals ? this.props.totals.totalIncome : 0;
        const expense = this.props.totals ? this.props.totals.totalExpense : 0;
        const filteredIncome = this.props.filteredTotals ? this.props.filteredTotals.totalIncome : 0;
        const filteredExpense = this.props.filteredTotals ? this.props.filteredTotals.totalExpense : 0;
        const filteredStyle = { display: (!this.props.showFiltered ? 'none' : ''), backgroundColor: 'rgb(224, 224, 224)'}
        return <div className="expense-table-monthly-status fixed-horizontal">
                <div className="monthly-calculation filtered" style={filteredStyle}>
                    <div className="header">Suodatetut tulot ja menot</div>
                    {this.getCalculationRow('Tulot', filteredIncome, false)}
                    {this.getCalculationRow('Menot', -Math.abs(filteredExpense), false)}
                    {this.getCalculationRow('', filteredIncome - filteredExpense, true)}
                </div>
                <div className="monthly-calculation">
                    <div className="header">Tulot ja menot</div>
                    {this.getCalculationRow('Tulot', income, false)}
                    {this.getCalculationRow('Menot', -Math.abs(expense), false)}
                    {this.getCalculationRow('', income - expense, true)}
                </div>
                <div className="monthly-calculation">
                    <div className="header">Saatavat/velat</div>
                    {this.getCalculationRow('Ennen', this.props.startStatus.balance, false)}
                    {this.getCalculationRow('Muutos', this.props.monthStatus.balance, false)}
                    {this.getCalculationRow('', this.props.endStatus.balance, true)}

                </div>
            </div>
    }
}

/**
 *             <ExpenseStatus className="expense-table-start-status fixed-horizontal" name="Tilanne ennen" status={this.props.startStatus} unconfirmedBefore={this.props.unconfirmedBefore} />
            <ExpenseStatus className="expense-table-month-status fixed-horizontal" name="Tämä kuukausi" status={this.props.monthStatus} />
            <ExpenseStatus className="expense-table-end-status fixed-horizontal" name="Lopputilanne" status={this.props.endStatus} />
 */
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

//TODO: tänne myös expensejen ja incomen total laskettuna!
export default class ExpenseTable extends React.Component<ExpenseTableProps, ExpenseTableState> {

    constructor(props) {
        super(props);
        //this.state = { details: {}, filters: [] };
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.renderExpense = this.renderExpense.bind(this);
    }
    public state: ExpenseTableState = {
        details: {},
        filters: [],
    };

    addFilter(fun, name, avatar) {
        this.setState(s => ({
            filters: s.filters.concat({ filter: fun, name: name, avatar: avatar })
        }));
    }

    removeFilter(index) {
        this.setState(s => {
            s.filters.splice(index, 1);
            return s;
        });
    }

    getFilteredExpenses() {
        return this.props.expenses ? this.state.filters.reduce((a, b) => a.filter(b.filter), this.props.expenses) : [];
    }

    renderExpense(expense) {
        return <ExpenseRow expense={ expense }
                    key={ "expense-row-" + expense.id }
                    addFilter={ this.addFilter }
                    onUpdated={ e => this.props.onUpdateExpense(expense.id, e) } />
    }

    private calculateTotals(expenses: any[]) {
        if (expenses.length < 1) return null;
        const income = expenses.filter(e => e.type === "income").reduce((s, c) => s.plus(c.sum), Money.zero);
        const expense = expenses.filter(e => e.type === "expense").reduce((s, c) => s.plus(c.sum), Money.zero);
        return {totalIncome: income, totalExpense: expense}
    }

    //TODO: tee erillinen funktio jossa lasketaan expensejen total income+expense
    getTotalRow(expenses) {
        if (expenses.length < 1) return [];
        /*const income = expenses.filter(e => e.type === "income").reduce((s, c) => s.plus(c.sum), Money.zero);
        const expense = expenses.filter(e => e.type === "expense").reduce((s, c) => s.plus(c.sum), Money.zero);*/
        const totals = this.calculateTotals(expenses)
        if (!totals) return [];
        return [<ExpenseTotal key="filtered-total" income={totals.totalIncome} expense={totals.totalExpense} />];
    }

    render() {
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
                        : []).concat(filtered.map(this.renderExpense))/*.concat(this.getTotalRow(filtered))*/
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
