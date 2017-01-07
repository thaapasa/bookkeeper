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
};

export default class ExpenseTable extends React.Component {

    constructor(props) {
        super(props);
        console.log("expenseTable constructor", this.props.year, this.props.month);
        this.state = { year : this.props.year, month : this.props.month, expenses : undefined };
    }

    componentDidMount() {
        if (typeof state.get("currentUser")  !== "undefined") {
            //TODO: Fix group!!
            apiConnect.getExpenses(sessionStorage.getItem("token"), 1, this.state.year, this.state.month)
                .then(e => {
                    console.log("MonthView: Got expenses", e);
                    this.setState({ expenses: e })
                });
        }
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
                            <TableHeaderColumn colSpan="4" tooltip="Kulut" style={{textAlign: 'left'}}>
                                Kulut
                            </TableHeaderColumn>
                        </TableRow>
                        <TableRow>
                            <TableHeaderColumn tooltip="Pvm">Pvm</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Kuvaus">Kuvaus</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Kategoria">Kategoria</TableHeaderColumn>
                            <TableHeaderColumn tooltip="Summa">Summa</TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody
                        displayRowCheckbox={false}
                    >
                        { this.state.expenses && this.state.expenses.map( (row, index) => (
                            <TableRow key={index} selected={row.selected}>

                                <TableRowColumn>{moment(row.date).format("D.M.")}</TableRowColumn>
                                <TableRowColumn>{row.description}</TableRowColumn>
                                <TableRowColumn>{row.category}</TableRowColumn>
                                <TableRowColumn>{new Money(row.sum).format()}</TableRowColumn>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>;
    }
}
