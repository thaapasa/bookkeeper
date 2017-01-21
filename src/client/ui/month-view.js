import React from "react"
import ExpenseTable from "./expense-table"
import ExpenseNavigation from "./expense-navigation"
import MonthViewTotal from "./month-view-total"
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
//const moment = require("moment")

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
        /*const currentDate = moment();
        console.log("Initializing monthView to", currentDate);
        this.state = { date : currentDate };*/
    }


    render() {
        console.log("render monthView");
        return <div className="content">
                <ExpenseNavigation/>
                <ExpenseTable/>
                <MonthViewTotal/>
            </div>;
    }
}
