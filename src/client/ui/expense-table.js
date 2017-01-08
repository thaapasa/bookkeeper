import React from 'react';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
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
    dateColumn: {
        width: "30px"
    }
};

export default class ExpenseTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = { year : this.props.year, month : this.props.month, expenses : undefined };
    }

    getCategoryString(categoryId) {
        let categoryString = "";
        const category = state.get("categoryMap").get(categoryId);
        if (category.parentId)
            categoryString +=  this.getCategoryString(category.parentId) + " - " ;
        categoryString += category.name;
        return categoryString;
    }

    getExpensesForView() {
        apiConnect.getExpenses(this.state.year, this.state.month)
            .then(e => {
                this.setState({ expenses: e })
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

    render() {
        return <div> <Table
                    fixedHeader={true}
                    fixedFooter={true}
                    selectable={false}
                    multiSelectable={false}
                >
                    <TableHeader
                        displaySelectAll={false}
                        adjustForCheckbox={false}
                        enableSelectAll={false}
                    >
                        <TableRow>
                            <TableHeaderColumn colSpan="6" style={{textAlign: 'center'}}>
                                { this.getYearMonthString() }
                            </TableHeaderColumn>
                        </TableRow>
                        <TableRow>
                            <TableHeaderColumn style={styles.dateColumn} tooltip="Pvm">Pvm</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Kuvaus">Kuvaus</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Kategoria">Kategoria</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Summa">Summa</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Tili">Tili</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Hyöty">Hyöty</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Hinta">Hinta</TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody
                        displayRowCheckbox={false}
                    >
                        { this.state.expenses && this.state.expenses.map( (row, index) => (
                            <TableRow key={index} selected={row.selected}>
                                <TableRowColumn style={styles.dateColumn} >{moment(row.date).format("D.M.")}</TableRowColumn>
                                <TableRowColumn>{row.description}</TableRowColumn>
                                <TableRowColumn>{this.getCategoryString(row.categoryId)}</TableRowColumn>
                                <TableRowColumn>{new Money(row.sum).format()}</TableRowColumn>
                                <TableRowColumn>{state.get("sources").find(s => s.id == row.sourceId).name}</TableRowColumn>
                                <TableRowColumn style={styles.benefit}>{new Money(row.benefit ? row.benefit : "0.00").format()}</TableRowColumn>
                                <TableRowColumn style={styles.cost}>{new Money(row.cost ? row.cost : "0.00").format()}</TableRowColumn>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>;
    }
}
