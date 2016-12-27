import React from "react"
//import * as state from  "../data/state";
//import ExpenseRow from "./expense-row"
import ExpenseTable from "./expense-table"

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing bookkeeper");
        this.state = { year : 2016, month : 12};
        //this.showValue = this.showValue.bind(this);
    }


    render() {
        console.log("render monthView");
        return <div className="content">
                <ExpenseTable year={this.state.year} month={this.state.month}/>
            </div>;
    }
}
