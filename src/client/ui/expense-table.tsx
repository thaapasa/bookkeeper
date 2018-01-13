import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip'
import ExpenseRow from './expense-row';
import {ExpenseHeader,ExpenseStatus,ExpenseTotal} from './expense-row';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import Money from '../../shared/util/money';

export default class ExpenseTable extends React.Component<any, any> {

    constructor(props) {
        super(props);
        this.state = { details: {}, filters: [] };
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.renderExpense = this.renderExpense.bind(this);
    }


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

    getTotalRow(expenses) {
        if (expenses.length < 1) return [];
        const income = expenses.filter(e => e.type === "income").reduce((s, c) => s.plus(c.sum), Money.zero);
        const expense = expenses.filter(e => e.type === "expense").reduce((s, c) => s.plus(c.sum), Money.zero);
        return [<ExpenseTotal key="filtered-total" income={income} expense={expense} />];
    }

    render() {
        const filtered = this.getFilteredExpenses();
        return <div className="expense-table bk-table">
            <ExpenseHeader className="expense-table-header bk-table-header"/>
            <ExpenseStatus className="expense-table-start-status" name="Tilanne ennen" status={this.props.startStatus} unconfirmedBefore={this.props.unconfirmedBefore} />
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
                        : []).concat(filtered.map(this.renderExpense)).concat(this.getTotalRow(filtered))
                }
            </div>
            <ExpenseStatus className="expense-table-month-status" name="Tämä kuukausi" status={this.props.monthStatus} />
            <ExpenseStatus className="expense-table-end-status" name="Lopputilanne" status={this.props.endStatus} />
        </div>
    }
}
