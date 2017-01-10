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

    render() {
        return <div> <Table
                    fixedHeader={true}
                    fixedFooter={true}
                    selectable={false}
                    multiSelectable={false}
                >

                    <TableBody
                        displayRowCheckbox={false}
                    >
                            <TableRow selected={false}>
                                <TableRowColumn style={Object.assign({}, styles.dateColumn, styles.header)} >Pvm</TableRowColumn>
                                <TableRowColumn style={Object.assign({}, styles.descriptionColumn, styles.header)}>Kuvaus</TableRowColumn>
                                <TableRowColumn style={Object.assign({}, styles.categoryColumn, styles.header)}>Kategoria</TableRowColumn>
                                <TableRowColumn style={styles.header}>Summa</TableRowColumn>
                                <TableRowColumn style={styles.header}>Tili</TableRowColumn>
                                <TableRowColumn style={Object.assign({}, styles.benefit, styles.header)}>Hyöty</TableRowColumn>
                                <TableRowColumn style={Object.assign({}, styles.cost, styles.header)}>Hinta</TableRowColumn>
                            </TableRow>

                        { this.state.expenses && this.state.expenses.map( (row, index) => (
                            <TableRow key={index} selected={row.selected}>
                                <TableRowColumn style={styles.dateColumn} >{moment(row.date).format("D.M.")}</TableRowColumn>
                                <TableRowColumn style={styles.descriptionColumn}>{row.description}</TableRowColumn>
                                <TableRowColumn style={styles.categoryColumn}>{this.getCategoryString(row.categoryId)}</TableRowColumn>
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
