import * as React from 'react';
import TopBar from '../component/TopBar';
import RoutedMonthView from '../expense/RoutedMonthView';
import RoutedCategoryView from '../category/RoutedCategoryView';
import ExpenseDialog from '../expense/ExpenseDialog';
import ConfirmationDialog from './ConfirmationDialog';
import NotificationBar from '../component/NotificationBar';
import DatePickerComponent from '../component/DatePickerComponent';
import FlatButton from 'material-ui/FlatButton';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { Session } from '../../../shared/types/Session';
import { categoryPagePath, expensePagePath } from '../../util/Links';
import styled from 'styled-components';

const MainContent = styled.div`
  margin-top: 56px;
`;

// tslint:disable jsx-no-lambda
function LinkButton({ label, to }: { label: string, to: string }) {
  return (
    <Route path={to} exact={true} children={({ match }) => (
        <Link to={to}>
          <FlatButton primary={!!match}>{label}</FlatButton>
        </Link>
      )} />
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
            <TopBar>
              <LinkButton label="Kulut" to={expensePagePath} />
              <LinkButton label="Kategoriat" to={categoryPagePath} />
            </TopBar>
            <MainContent>
              <Switch>
                <Route exact={true} path="/" component={RoutedMonthView} />
                <Route path={expensePagePath} component={RoutedMonthView} />
                <Route path={categoryPagePath} component={RoutedCategoryView} />
              </Switch>
            </MainContent>
          </div>
        </Router>
        <DatePickerComponent />
        <NotificationBar />
      </div>
    );
  }
}
