import React from 'react';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
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
    balance: {
        color: "blue"
    },
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
        this.state = { year : this.props.year, month : this.props.month, expenses : undefined };
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

    getExpensesForView() {
        return apiConnect.getExpenses(this.state.year, this.state.month)
            .then(e => {
                this.setState({ expenses: e });
                return null;
            })
            .catch(err => { console.log("Caught error when getting expenses", err) });
    }

    componentDidMount() {
        state.get("expensesUpdatedStream").onValue(e => { this.getExpensesForView() });
        this.getExpensesForView();
    }

    getYearMonthString() {
        return time.getFinnishMonthName(this.state.month) + " " + this.state.year;
    }

    deleteExpense(e) {
        apiConnect.deleteExpense(e.id)
            .then(this.getExpensesForView)
            .catch(e => console.log("Could not delete:", e));
    }

    render() {
        return <div>
            <Table
                fixedHeader={true}
                fixedFooter={true}
                selectable={false}
                multiSelectable={false}>

                <TableBody displayRowCheckbox={false}>
                    <TableRow>
                        <TableHeaderColumn colSpan="10" style={{textAlign: 'center', fontSize: "14pt" }}>
                            { this.getYearMonthString() }
                        </TableHeaderColumn>
                    </TableRow>

                    <TableRow selected={false}>
                        <TableRowColumn style={Object.assign({}, styles.dateColumn, styles.header)} >Pvm</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.descriptionColumn, styles.header)}>Kuvaus</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.descriptionColumn, styles.header)}>Kohde</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.categoryColumn, styles.header)}>Kategoria</TableRowColumn>
                        <TableRowColumn style={styles.header}>Summa</TableRowColumn>
                        <TableRowColumn style={styles.header}>Tili</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.benefit, styles.header)}>Hyöty</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.cost, styles.header)}>Hinta</TableRowColumn>
                        <TableRowColumn style={Object.assign({}, styles.cost, styles.header)}>Balanssi</TableRowColumn>
                        <TableRowColumn/>
                    </TableRow>

                    { this.state.expenses && this.state.expenses.map( (row, index) => {
                        return <TableRow key={index} selected={row.selected}>
                            <TableRowColumn
                                style={styles.dateColumn}>{moment(row.date).format("D.M.")}</TableRowColumn>
                            <TableRowColumn style={styles.descriptionColumn}>{row.description}</TableRowColumn>
                            <TableRowColumn style={styles.descriptionColumn}>{row.receiver}</TableRowColumn>
                            <TableRowColumn
                                style={styles.categoryColumn}>{this.getCategoryString(row.categoryId)}</TableRowColumn>
                            <TableRowColumn>{new Money(row.sum).format()}</TableRowColumn>
                            <TableRowColumn>{state.get("sourceMap")[row.sourceId].name}</TableRowColumn>
                            <TableRowColumn style={styles.benefit}>{ row.userBenefit.format() }</TableRowColumn>
                            <TableRowColumn style={styles.cost}>{ row.userCost.format() }</TableRowColumn>
                            <TableRowColumn style={styles.balance}>{ row.userBalance.format() }</TableRowColumn>
                            <TableRowColumn>
                                <IconButton iconClassName="material-icons" title="Muokkaa"
                                            onClick={()=>state.get("expenseDialogStream").push(row)}>edit</IconButton>
                                <IconButton iconClassName="material-icons" title="Poista"
                                            onClick={()=>this.deleteExpense(row)} iconStyle={{ color: "red"}}>delete</IconButton>
                            </TableRowColumn>
                        </TableRow>
                    })}
                </TableBody>
            </Table>
        </div>
    }
}
