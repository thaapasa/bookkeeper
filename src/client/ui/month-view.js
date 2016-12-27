import React from "react"
import * as state from  "../data/state";
import * as apiConnect from "../data/api-connect";
import ExpenseRow from "./expense-row"

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing bookkeeper");
        this.state = { month : undefined, expenses : [] };
        //this.showValue = this.showValue.bind(this);
    }

    componentDidMount() {
        if (typeof state.get("currentUser")  !== "undefined") {
            apiConnect.getExpenses(sessionStorage.getItem("token"), 1, 2016, 12)
                .then(e => {
                    console.log("MonthView: Got expenses", e);
                    this.setState({ expenses: e })
                });
        }
        //this.getUsers(u => this.setState({ users: u }));
        //this.getExpenses(e => this.setState({ expenses: e }));
    }
    /*                <div>{console.log("Rendering expenses", this.state.expenses)}{this.state.expenses.map(e => <div key={e.id}>{e.description} {e.sum}</div>)}</div>*/

    render() {
        console.log("render monthView");
        console.log("Rendering expenses", this.state.expenses);
        return <div className="content">
            {
                this.state.expenses.map(e => <ExpenseRow expense={e} key={e.id}/>)
            }
            </div>;
    }
}
