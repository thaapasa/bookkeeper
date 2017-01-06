import React from "react"
import ExpenseTable from "./expense-table"
const moment = require("moment")

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing bookkeeper");
        const currentDate = moment();
        this.state = { year : currentDate.year(), month : currentDate.month() + 1};
    }


    render() {
        console.log("render monthView");
        return <div className="content">
                <ExpenseTable year={this.state.year} month={this.state.month}/>
            </div>;
    }
}
