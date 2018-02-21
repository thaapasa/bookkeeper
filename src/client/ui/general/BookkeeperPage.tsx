import * as React from 'react';
import TopBar from '../component/TopBar';
import NavigationBar from '../component/NavigationBar';
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
import { colorScheme } from '../Colors';

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

const linkStyle: React.CSSProperties = {
  marginLeft: '10px',
  minWidth: '140px',
  color: colorScheme.primary.dark,
  textTransform: 'uppercase',
};

const selectedLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: colorScheme.secondary.standard,
};

// tslint:disable jsx-no-lambda
function LinkButton({ label, to }: { label: string, to: string }) {
  return (
    <Route path={to} children={({ match }) => (
        <Link to={to}>
          <FlatButton style={match ? selectedLinkStyle : linkStyle}>{label}</FlatButton>
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
                <Route exact={true} path="/" component={RoutedMonthView} />
                <Route path={expensePagePath} component={RoutedMonthView} />
                <Route path={categoryPagePath} component={RoutedCategoryView} />
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
