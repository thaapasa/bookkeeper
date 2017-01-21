import React from 'react';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import ExpenseDetails from "./expense-details"
import IconButton from 'material-ui/IconButton';
import Avatar from 'material-ui/Avatar';
import UserAvatar from "./user-avatar";
import Chip from "material-ui/Chip"

import * as apiConnect from "../data/api-connect";
import * as state from  "../data/state";
import * as categories from  "../data/categories";
import * as time from "../../shared/util/time"
const moment = require("moment");
const Money = require("../../shared/util/money");

const styles = {
    smallIcon: {
        margin: "0",
        padding: "0",
        width: 36,
        height: 36
    },
    propContainer: {
        width: 200,
        overflow: 'hidden',
        margin: '20px auto 0',
    },
    propToggleHeader: {
        margin: '20px auto 10px',
    },
    benefit: {
        color: "green"
    },
    cost: {
        color: "red"
    },
    balance: (b) => b.gt(0) ? "positive" : ( b.lt(0) ? "negative" : "zero"),
    dateColumn: {
        width: "30px"
    },
    descriptionColumn: {
        width: "150px"
    },
    categoryColumn: {
        width: "150px"
    },
    header: {
        color: "lightgrey"
    }
};

function acceptAll() {
    return true;
}

export default class ExpenseTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = { date : moment(), expenses : [], details: {}, filters: [] };
        this.toggleDetails = this.toggleDetails.bind(this);
        this.deleteExpense = this.deleteExpense.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.getExpensesForView = this.getExpensesForView.bind(this);
    }

    getExpensesForView(date) {
        const next = moment(date);
        console.log("getExpensesForView", next);
        this.setState(s => ({ date: next, details: {} }));
        return apiConnect.getExpensesForMonth(next.year(), next.month() + 1)
            .then(e => {
                console.log("got expenses");
                this.setState({ expenses: e });
                return null;
            })
            .catch(err => { console.log("Caught error when getting expenses", err) });
    }

    showExpenseDetails(id, details) {
        this.setState(s => ({ details: Object.assign(s.details, { [id] : details })}));
        return null;
    }

    toggleDetails(expense, details) {
        if (details) {
            this.setState(s => {
                const det = s.details;
                delete det[expense.id];
                return { details: det };
            });
        } else {
            this.showExpenseDetails(expense.id, {});
            apiConnect.getExpense(expense.id)
                .then(e => this.showExpenseDetails(expense.id, e))
                .catch(e => console.log("Error", e));
        }
    }

    componentDidMount() {
        state.get("expensesUpdatedStream").onValue(d => { this.getExpensesForView(d) });
        this.getExpensesForView(moment());
    }

    static getYearMonthString(date) {
        return time.getFinnishMonthName(date.month() + 1) + " " + date.year();
    }

    deleteExpense(e) {
        apiConnect.deleteExpense(e.id)
            .then(this.getExpensesForView)
            .catch(e => console.log("Could not delete:", e));
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
        return this.state.expenses ? this.state.filters.reduce((a, b) => a.filter(b.filter), this.state.expenses) : [];
    }

    render() {
        return <div className="expense-table">
            <div className="expense-row header">
                <div className="expense-detail date">Pvm.</div>
                <div className="expense-detail user"></div>
                <div className="expense-detail description">Selite</div>
                <div className="expense-detail receiver">Kohde</div>
                <div className="expense-detail category">Kategoria</div>
                <div className="expense-detail source">Lähde</div>
                <div className="expense-detail sum">Summa</div>
                <div className="expense-detail balance">Balanssi</div>
                <div className="expense-detail tools"></div>
            </div>
            { this.state.filters.length > 0 ?
                <div className="expense-row">
                    <div className="expense-filters">{
                        this.state.filters.map((f, index) => <Chip
                            key={index}
                            style={{ margin: "0.3em", padding: 0 }}
                            onRequestDelete={() => this.removeFilter(index)}>
                            { f.avatar ? <Avatar src={f.avatar} /> : null }
                            { f.name }
                        </Chip>)
                    }</div>
                </div>
                : undefined
            }
            { this.getFilteredExpenses().map(expense => {
                const details = this.state.details[expense.id];
                return [<div key={expense.id} className="expense-row">
                    <div className="expense-detail date">{ moment(expense.date).format("D.M.") }</div>
                    <div className="expense-detail user">
                        <UserAvatar userId={expense.userId} size={25} onClick={
                            () => this.addFilter(
                                e => e.userId == expense.userId,
                                state.get("userMap")[expense.userId].firstName,
                                state.get("userMap")[expense.userId].image)
                        }/>
                    </div>
                    <div className="expense-detail description">{ expense.description }</div>
                    <div className="expense-detail receiver">{ expense.receiver }</div>
                    <div className="expense-detail category"><a href="#" onClick={
                        () => this.addFilter(e => e.categoryId == expense.categoryId, categories.getFullName(expense.categoryId))
                    }>{categories.getFullName(expense.categoryId)}</a></div>
                    <div className="expense-detail source">{ state.get("sourceMap")[expense.sourceId].name }</div>
                    <div className="expense-detail sum">{ Money.from(expense.sum).format() }</div>
                    <div className={ `expense-detail balance ${styles.balance(expense.userBalance)}` } onClick={
                        () => Money.zero.equals(expense.userBalance) ?
                            this.addFilter(e => Money.zero.equals(e.userBalance), "Balanssi == 0") :
                            this.addFilter(e => !Money.zero.equals(e.userBalance), "Balanssi != 0")
                    }>{ Money.from(expense.userBalance).format() }</div>
                    <div className="expense-detail tools">
                        <IconButton iconClassName="material-icons" title="Tiedot" style={styles.smallIcon}
                                    onClick={()=>this.toggleDetails(expense, details)}>{ details ? "expand_less" : "expand_more" }</IconButton>
                        <IconButton iconClassName="material-icons" title="Muokkaa" style={styles.smallIcon}
                                    onClick={()=>apiConnect.getExpense(expense.id).then(e => state.get("expenseDialogStream").push(e))}>edit</IconButton>
                        <IconButton iconClassName="material-icons" title="Poista" style={styles.smallIcon}
                                    onClick={()=>this.deleteExpense(expense)} iconStyle={{ color: "red"}}>delete</IconButton>
                    </div>
                </div>].concat(details && details.division ?
            [<ExpenseDetails division={details.division}/>] : [])
            })}
        </div>
    }
}
