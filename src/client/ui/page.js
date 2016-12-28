import React from "react"
import TopBar from "./topbar"
import MonthView from "./month-view"
import ExpenseDialog from "./expense-dialog"

export default class BookkeeperPage extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing bookkeeper");
    }

    render() {
        console.log("render", this.props);
        return <div className="everything">
            <ExpenseDialog />
            <TopBar/>
            <div className="main-content">
                <div>Hei { this.props.session.user.firstname }!</div>
                <div><MonthView/></div>
            </div>
        </div>;
    }
}
