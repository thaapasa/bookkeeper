import React from "react"
import TopBar from "./topbar"
import MonthView from "./month-view"
import ExpenseDialog from "./expense-dialog"

export default class BookkeeperPage extends React.Component {

    constructor(props) {
        super(props);
        console.log("Initializing bookkeeper");
        const session = this.props.session;
        this.state = {
            session: session,
            user: session.user,
            categories: session.categories,
            groups: session.groups,
            users: session.users,
            sources: session.sources
        };
    }

    render() {
        console.log("render", this.state);
        return <div className="everything">
            <ExpenseDialog />
            <TopBar user={this.state.user} />
            <div className="main-content">
                <div>Hei { this.state.user.firstName }!</div>
                <div><MonthView/></div>
            </div>
        </div>;
    }
}
