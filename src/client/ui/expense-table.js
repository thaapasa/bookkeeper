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
    balance: (b) => b.gt(0) ? { color: "blue" } : ( b.lt(0) ? { color: "red" } : { color: "gray" }),
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
        return <Table
                   fixedHeader={true}
                   fixedFooter={true}
                   selectable={false}
                   multiSelectable={false}><TableBody displayRowCheckbox={false}>
                    <TableRow selected={false}>
                        <TableRowColumn style={Object.assign({}, styles.dateColumn, styles.header)} >Pvm</TableRowColumn>
                        <TableRowColumn/>
                        <TableRowColumn style={Object.assign({}, styles.descriptionColumn, styles.header)}>Kuvaus</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.descriptionColumn, styles.header)}>Kohde</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.categoryColumn, styles.header)}>Kategoria</TableRowColumn>
                        <TableRowColumn style={styles.header}>Summa</TableRowColumn>
                        <TableRowColumn style={styles.header}>Tili</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.cost, styles.header)}>Balanssi</TableRowColumn>
                        <TableRowColumn/>
                    </TableRow>
                    { this.state.filters.length > 0 ?
                        <TableRow>
                            <TableRowColumn colSpan="9">
                                <div style={{ display: "flex" }}>{
                                    this.state.filters.map((f, index) => <Chip
                                        key={index}
                                        style={{ margin: "0.3em", padding: 0 }}
                                        onRequestDelete={() => this.removeFilter(index)}>
                                        { f.avatar ? <Avatar src={f.avatar} /> : null }
                                        { f.name }
                                    </Chip>)
                                }</div>
                            </TableRowColumn>
                        </TableRow> :
                        undefined
                    }
                    { this.getFilteredExpenses().map( (row, index) => {
                        const details = this.state.details[row.id];
                        return [<TableRow key={index} selected={row.selected}>
                            <TableRowColumn
                                style={styles.dateColumn}>{moment(row.date).format("D.M.")}</TableRowColumn>
                            <TableRowColumn><UserAvatar userId={row.userId} size={25} onClick={
                                () => this.addFilter(
                                    e => e.userId == row.userId,
                                    state.get("userMap")[row.userId].firstName,
                                    state.get("userMap")[row.userId].image)
                            }/></TableRowColumn>
                            <TableRowColumn style={styles.descriptionColumn}>{row.description}</TableRowColumn>
                            <TableRowColumn style={styles.descriptionColumn}>{row.receiver}</TableRowColumn>
                            <TableRowColumn
                                style={styles.categoryColumn}><a href="#" onClick={
                                    () => this.addFilter(e => e.categoryId == row.categoryId, categories.getFullName(row.categoryId))
                                }>{categories.getFullName(row.categoryId)}</a></TableRowColumn>
                            <TableRowColumn>{new Money(row.sum).format()}</TableRowColumn>
                            <TableRowColumn>{state.get("sourceMap")[row.sourceId].name}</TableRowColumn>
                            <TableRowColumn style={styles.balance(row.userBalance)}><div onClick={
                                () => Money.zero.equals(row.userBalance) ?
                                    this.addFilter(e => Money.zero.equals(e.userBalance), "Balanssi == 0") :
                                    this.addFilter(e => !Money.zero.equals(e.userBalance), "Balanssi != 0")
                            }>{ row.userBalance.format() }</div></TableRowColumn>
                            <TableRowColumn>
                                <IconButton iconClassName="material-icons" title="Tiedot"
                                            onClick={()=>this.toggleDetails(row, details)}>{ details ? "expand_less" : "expand_more" }</IconButton>
                                <IconButton iconClassName="material-icons" title="Muokkaa"
                                            onClick={()=>apiConnect.getExpense(row.id).then(e => state.get("expenseDialogStream").push(e))}>edit</IconButton>
                                <IconButton iconClassName="material-icons" title="Poista"
                                            onClick={()=>this.deleteExpense(row)} iconStyle={{ color: "red"}}>delete</IconButton>
                            </TableRowColumn>
                        </TableRow>].concat(details && details.division ?
                            [<TableRow><TableRowColumn colSpan="8"><ExpenseDetails division={details.division}/></TableRowColumn></TableRow>] : [])
                    })}
            </TableBody>
        </Table>
    }
}
