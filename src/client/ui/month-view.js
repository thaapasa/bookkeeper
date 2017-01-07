import React from "react"
import ExpenseTable from "./expense-table"
const moment = require("moment")

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
        const now = moment();
        console.log("Initializing month view to", now);
        this.state = { year : now.year(), month : now.month() + 1 };
    }


    render() {
        console.log("render monthView");
        return <div className="content">
                <ExpenseTable year={this.state.year} month={this.state.month}/>
            </div>;
    }
}
