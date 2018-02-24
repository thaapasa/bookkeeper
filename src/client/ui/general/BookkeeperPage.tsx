import * as React from 'react';
import styled from 'styled-components';
import TopBar from '../component/TopBar';
import NavigationBar, { LinkButton } from '../component/NavigationBar';
import RoutedMonthView from '../expense/RoutedMonthView';
import RoutedCategoryView from '../category/RoutedCategoryView';
import ExpenseDialog from '../expense/ExpenseDialog';
import ConfirmationDialog from './ConfirmationDialog';
import NotificationBar from '../component/NotificationBar';
import DatePickerComponent from '../component/DatePickerComponent';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Session } from '../../../shared/types/Session';
import { categoryPagePath, expensePagePath, expenseMonthPathPattern, categoryViewMonthPattern, categoryViewYearPattern } from '../../util/Links';
import { colorScheme } from '../Colors';

interface PageProps {
  session: Session;
}

export default class BookkeeperPage extends React.Component<PageProps, {}> {

  public render() {
    return (
      <Page>
        <ExpenseDialog />
        <ConfirmationDialog />
        <Router>
          <div>
            <TopBar />
            <NavigationBar>
              <LinkButton label="Kulut" to={expensePagePath} />
              <LinkButton label="Kategoriat" to={categoryPagePath} />
            </NavigationBar>
            <MainContent>
              <Switch>
                <Route path={expenseMonthPathPattern('date')} component={RoutedMonthView} />
                <Route path={expensePagePath} component={RoutedMonthView} />
                <Route path={categoryViewYearPattern('year')} component={RoutedCategoryView} />
                <Route path={categoryViewMonthPattern('month')} component={RoutedCategoryView} />
                <Route path={categoryPagePath} component={RoutedCategoryView} />
                <Route exact={true} path="/" component={RoutedMonthView} />
              </Switch>
            </MainContent>
          </div>
        </Router>
        <DatePickerComponent />
        <NotificationBar />
      </Page>
    );
  }
}

const Page = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${colorScheme.gray.light};
`;

const MainContent = styled.div`
  margin: 32px;
  margin-top: 40px;
  background-color: ${colorScheme.primary.light};
  box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.5);
`;
