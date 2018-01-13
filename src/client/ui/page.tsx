import * as React from 'react';
import TopBar from './topbar';
import MonthView from './month-view';
import CategoryView from './category-view';
import ExpenseDialog from './expense-dialog';
import ConfirmationDialog from './confirmation-dialog';
import NotificationBar from './notification-bar';
import DatePickerComponent from './date-picker-component';
import FlatButton from 'material-ui/FlatButton';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { Session } from '../../shared/types/session';
const debug = require('debug')('bookkeeper:page');

function LinkButton({ label, to }: { label: string, to: string }) {
    return (
        <Route path={to} exact={true} children={({ match }) => 
            <Link to={to}>
                <FlatButton primary={!!match}>{label}</FlatButton>
            </Link>} />
    );
}

interface PageProps {
    session: Session;
}

export default class BookkeeperPage extends React.Component<PageProps, {}> {

    public render() {
        return (
            <div>
                <ExpenseDialog />
                <ConfirmationDialog />
                <Router>
                    <div>
                        <TopBar user={this.props.session.user}>
                            <LinkButton label="Kulut" to="/" />
                            <LinkButton label="Kategoriat" to="/p/kategoriat" />
                        </TopBar>
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
        );
    }
}
