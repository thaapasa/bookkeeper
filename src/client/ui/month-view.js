import React from "react"
import ExpenseTable from "./expense-table"
import ExpenseNavigation from "./expense-navigation"
import MonthViewTotal from "./month-view-total"

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return <div className="content">
            <ExpenseNavigation/>
            <ExpenseTable/>
        </div>
    }
}
