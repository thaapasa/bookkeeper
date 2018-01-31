import * as React from 'react';
import TopBar from '../component/topbar';
import MonthView from '../expense/month-view';
import CategoryView from '../category/category-view';
import ExpenseDialog from '../expense/expense-dialog';
import ConfirmationDialog from './ConfirmationDialog';
import NotificationBar from '../component/notification-bar';
import DatePickerComponent from '../component/date-picker-component';
import FlatButton from 'material-ui/FlatButton';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { Session } from '../../../shared/types/Session';
import { categoryPagePath, expensePagePath } from '../../util/links';

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
                            <LinkButton label="Kulut" to={expensePagePath} />
                            <LinkButton label="Kategoriat" to={categoryPagePath} />
                        </TopBar>
                        <div className="main-content">
                            <Switch>
                                <Route exact path="/" component={MonthView} />
                                <Route path={expensePagePath} component={MonthView} />
                                <Route path={categoryPagePath} component={CategoryView} />
                            </Switch>
                        </div>
                    </div>
                </Router>
                <DatePickerComponent />
                <NotificationBar />
            </div>
        );
    }
}
