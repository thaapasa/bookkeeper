import * as React from 'react';
import TopBar from "./topbar"
import MonthView from "./month-view"
import CategoryView from "./category-view"
import ExpenseDialog from "./expense-dialog"
import ConfirmationDialog from "./confirmation-dialog"
import NotificationBar from "./notification-bar"
import DatePickerComponent from "./date-picker-component"
import FlatButton from "material-ui/FlatButton";
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import * as log from "../../shared/util/log"

const TopBarJs: any = TopBar;

const LinkButton = ({ label, to }) => (
    <Route path={to} exact={true} children={ ({ match }) => <Link to={to}><FlatButton primary={!!match}>{label}</FlatButton></Link> }/>
)

interface PageProps {
    session: { [key: string]: any };
}
interface PageState {
    session: any;
    user: any;
    categories: any;
    groups: any;
    users: any;
    sources: any;
}

export default class BookkeeperPage extends React.Component<PageProps, PageState> {

    public state: PageState;

    constructor(props: PageProps) {
        super(props);
        log.info("Initializing bookkeeper page");
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

    public render() {
        return <div className="everything">
            <ExpenseDialog />
            <ConfirmationDialog />
            <Router>
                <div>
                    <TopBarJs user={this.state.user}>
                        <LinkButton label="Kulut" to="/" />
                        <LinkButton label="Kategoriat" to="/p/kategoriat" />
                    </TopBarJs>
                    <div className="main-content">
                        <Route exact path="/" component={MonthView} />
                        <Route path="/p/kulut" component={MonthView} />
                        <Route path="/p/kategoriat" component={CategoryView} />
                    </div>
                </div>
            </Router>
            <DatePickerComponent />
            <NotificationBar />
        </div>
    }
}
