import React from "react"
import ExpenseTable from "./expense-table"
const moment = require("moment")

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
        const currentDate = moment();
        console.log("Initializing monthView to", currentDate);
        this.state = { date : currentDate };
    }


    render() {
        console.log("render monthView");
        return <div className="content">
                <ExpenseTable date={this.state.date} />
            </div>;
    }
}
