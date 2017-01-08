import React from 'react';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import * as apiConnect from "../data/api-connect";
import * as state from  "../data/state";
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
    }
};

export default class ExpenseTable extends React.Component {

    constructor(props) {
        super(props);
        console.log("expenseTable constructor", this.props.year, this.props.month);
        this.state = { year : this.props.year, month : this.props.month, expenses : undefined };
    }

    getCategoryString(categoryId) {
        console.log("getCategoryString", categoryId);
        let categoryString = "";
        const category = state.get("categoryMap").get(categoryId);
        if (category.parentId)
            categoryString +=  this.getCategoryString(category.parentId) + " - " ;
        categoryString += category.name;
        return categoryString;
    }

    componentDidMount() {
        apiConnect.getExpenses(this.state.year, this.state.month)
            .then(e => {
                console.log("MonthView: Got expenses", e);
                this.setState({ expenses: e })
            })
            .catch(err => { console.log("Caught error when getting expenses", err) });
    }

    render() {
        return <div> <Table
                    height="300px"
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
                            <TableHeaderColumn colSpan="6" tooltip="Kulut" style={{textAlign: 'left'}}>
                                Kulut
                            </TableHeaderColumn>
                        </TableRow>
                        <TableRow>
                            <TableHeaderColumn tooltip="Pvm">Pvm</TableHeaderColumn>
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
                                <TableRowColumn>{moment(row.date).format("D.M.")}</TableRowColumn>
                                <TableRowColumn>{row.description}</TableRowColumn>
                                <TableRowColumn>{this.getCategoryString(row.categoryId)}</TableRowColumn>
                                <TableRowColumn>{new Money(row.sum).format()}</TableRowColumn>
                                <TableRowColumn>{state.get("sources").find(s => s.id == row.sourceId).name}</TableRowColumn>
                                <TableRowColumn style={styles.benefit}>{new Money(row.benefit).format()}</TableRowColumn>
                                <TableRowColumn style={styles.cost}>{new Money(row.cost).format()}</TableRowColumn>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>;
    }
}
