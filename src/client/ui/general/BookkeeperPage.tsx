import * as React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';

import { Session } from 'shared/types/Session';

import {
  categoryPagePath,
  categoryViewMonthPattern,
  categoryViewYearPattern,
  expenseMonthPathPattern,
  expensePagePath,
  infoPagePath,
  newExpensePath,
  searchPagePath,
  shortcutsPage,
} from '../../util/Links';
import RoutedCategoryView from '../category/RoutedCategoryView';
import { colorScheme } from '../Colors';
import DatePickerComponent from '../component/DatePickerComponent';
import NavigationBar, { AppLink } from '../component/NavigationBar';
import NotificationBar from '../component/NotificationBar';
import TopBar from '../component/TopBar';
import ExpenseDialog from '../expense/dialog/ExpenseDialogListener';
import FrontpageView from '../expense/FrontpageView';
import { NewExpenseView } from '../expense/NewExpenseView';
import RoutedMonthView from '../expense/RoutedMonthView';
import InfoView from '../info/InfoView';
import SearchView from '../search/SearchView';
import {
  getScreenSizeClassName,
  isMobileSize,
  mainContentMargin,
  mainContentMaxWidth,
} from '../Styles';
import { Size } from '../Types';
import ConfirmationDialog from './ConfirmationDialog';
import ShortcutsView from './ShortcutsView';

interface PageProps {
  session: Session;
  windowSize: Size;
}

const appLinks: AppLink[] = [
  { label: 'Linkit', path: shortcutsPage, showInHeader: false },
  { label: 'Kulut', path: expensePagePath, showInHeader: true },
  { label: 'Kategoriat', path: categoryPagePath, showInHeader: true },
  { label: 'Haku', path: searchPagePath, showInHeader: true },
  { label: 'Tiedot', path: infoPagePath, showInHeader: false },
];

export default class BookkeeperPage extends React.Component<PageProps> {
  public render() {
    const isMobileDevice = isMobileSize(this.props.windowSize);
    const className = getScreenSizeClassName(this.props.windowSize);
    return (
      <Page>
        <ExpenseDialog windowSize={this.props.windowSize} />
        <ConfirmationDialog />
        <Router>
          <ContentContainer>
            <TopBar links={appLinks} windowSize={this.props.windowSize} />
            {isMobileDevice ? null : <NavigationBar links={appLinks} />}
            <MainContent className={'main-content ' + className}>
              <Switch>
                <Route path={newExpensePath} component={NewExpenseView} />
                <Route
                  path={expenseMonthPathPattern('date')}
                  component={RoutedMonthView}
                />
                <Route path={expensePagePath} component={RoutedMonthView} />
                <Route
                  path={categoryViewYearPattern('year')}
                  component={RoutedCategoryView}
                />
                <Route
                  path={categoryViewMonthPattern('month')}
                  component={RoutedCategoryView}
                />
                <Route path={shortcutsPage} component={ShortcutsView} />
                <Route path={categoryPagePath} component={RoutedCategoryView} />
                <Route path={searchPagePath} component={SearchView} />
                <Route path={infoPagePath} component={InfoView} />
                <Route exact={true} path="/" component={FrontpageView} />
              </Switch>
            </MainContent>
          </ContentContainer>
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

const ContentContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const MainContent = styled.div`
  flex: 1;
  margin: ${mainContentMargin}px;
  margin-top: 40px;
  background-color: ${colorScheme.primary.light};
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  &.mobile-portrait,
  &.mobile-landscape {
    margin: 0;
    box-shadow: none;
  }

  &.large {
    margin-left: auto;
    margin-right: auto;
    width: ${mainContentMaxWidth}px;
  }
`;
