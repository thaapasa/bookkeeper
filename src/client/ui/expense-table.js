import React from 'react';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import ExpenseDetails from "./expense-details"
import FontIcon from 'material-ui/FontIcon';
import IconButton from 'material-ui/IconButton';

import * as apiConnect from "../data/api-connect";
import * as state from  "../data/state";
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

export default class ExpenseTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = { date : moment(), expenses : [], details: {} };
        this.toggleDetails = this.toggleDetails.bind(this);
        this.deleteExpense = this.deleteExpense.bind(this);
        this.getExpensesForView = this.getExpensesForView.bind(this);
    }

    getCategoryString(categoryId) {
        let categoryString = "";
        const category = state.get("categoryMap")[categoryId];
        if (category.parentId)
            categoryString +=  this.getCategoryString(category.parentId) + " - " ;
        categoryString += category.name;
        return categoryString;
    }

    getExpensesForView(next) {
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

    render() {
        return  <Table
                   fixedHeader={true}
                   fixedFooter={true}
                   selectable={false}
                   multiSelectable={false}><TableBody displayRowCheckbox={false}>
                    <TableRow selected={false}>
                        <TableRowColumn style={Object.assign({}, styles.dateColumn, styles.header)} >Pvm</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.descriptionColumn, styles.header)}>Kuvaus</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.descriptionColumn, styles.header)}>Kohde</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.categoryColumn, styles.header)}>Kategoria</TableRowColumn>
                        <TableRowColumn style={styles.header}>Summa</TableRowColumn>
                        <TableRowColumn style={styles.header}>Tili</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.cost, styles.header)}>Balanssi</TableRowColumn>
                        <TableRowColumn/>
                    </TableRow>

                    { this.state.expenses && this.state.expenses.map( (row, index) => {
                        const details = this.state.details[row.id];
                        return [<TableRow key={index} selected={row.selected}>
                            <TableRowColumn
                                style={styles.dateColumn}>{moment(row.date).format("D.M.")}</TableRowColumn>
                            <TableRowColumn style={styles.descriptionColumn}>{row.description}</TableRowColumn>
                            <TableRowColumn style={styles.descriptionColumn}>{row.receiver}</TableRowColumn>
                            <TableRowColumn
                                style={styles.categoryColumn}>{this.getCategoryString(row.categoryId)}</TableRowColumn>
                            <TableRowColumn>{new Money(row.sum).format()}</TableRowColumn>
                            <TableRowColumn>{state.get("sourceMap")[row.sourceId].name}</TableRowColumn>
                            <TableRowColumn style={styles.balance(row.userBalance)}>{ row.userBalance.format() }</TableRowColumn>
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
