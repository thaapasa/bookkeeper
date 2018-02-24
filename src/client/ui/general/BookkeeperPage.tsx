import * as React from 'react';
import styled from 'styled-components';
import TopBar from '../component/TopBar';
import NavigationBar, { AppLink } from '../component/NavigationBar';
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
import { Size } from '../Types';
import { isSmallDevice, getScreenSizeClassName, largeDeviceMinWidth } from '../Styles';

interface PageProps {
  session: Session;
  windowSize: Size;
}

const appLinks: AppLink[] = [
  { label: 'Kulut', path: expensePagePath },
  { label: 'Kategoriat', path: categoryPagePath },
];

export default class BookkeeperPage extends React.Component<PageProps, {}> {

  public render() {
    const smallDevice = isSmallDevice(this.props.windowSize);
    const className = getScreenSizeClassName(this.props.windowSize);
    return (
      <Page>
        <ExpenseDialog />
        <ConfirmationDialog />
        <Router>
          <div>
            <TopBar links={smallDevice ? appLinks : undefined} />
            <NavigationBar links={smallDevice ? undefined : appLinks} windowSize={this.props.windowSize} />
            <MainContent className={className}>
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
  flex: auto;
  margin: 32px;
  margin-top: 40px;
  background-color: ${colorScheme.primary.light};
  box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.5);

  &.small {
    margin: 0;
    box-shadow: none;
  }

  &.large {
    margin-left: auto;
    margin-right: auto;
    width: ${largeDeviceMinWidth - 64}px;
  }
`;
