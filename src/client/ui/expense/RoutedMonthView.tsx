import * as React from 'react';
import moment from 'moment';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { expenseMonthPathPattern, monthPattern } from '../../util/Links';
import { RouteComponentProps } from 'react-router';
import MonthView from './MonthView';

interface MonthRouteParams {
  date?: string;
};

class RoutedMonthView extends React.Component<RouteComponentProps<MonthRouteParams>, {}> {
  private getDate(): moment.Moment {
    if (!this.props.match.params.date) { return moment(); }
    return moment(this.props.match.params.date, monthPattern);
  }

  public render() {
    const date = this.getDate();
    this.props.history;
    return <MonthView date={date} history={this.props.history} />;
  }
}

export default class MonthViewWrapper extends React.Component<{}, {}> {
  public render() {
    return (
      <Router>
        <Switch>
          <Route path={expenseMonthPathPattern('date')} component={RoutedMonthView} />
          <Route path="" component={RoutedMonthView} />
        </Switch>
      </Router>
    );
  }
}
