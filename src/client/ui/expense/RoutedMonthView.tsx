import * as React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { expenseMonthPathPattern, monthPattern } from '../../util/Links';
import { RouteComponentProps } from 'react-router';
import MonthView from './MonthView';
import { Moment } from 'moment';
import { toMoment } from '../../../shared/util/Time';

interface MonthRouteParams {
  date?: string;
}

class RoutedMonthView extends React.Component<RouteComponentProps<MonthRouteParams>, {}> {
  private getDate(): Moment {
    if (!this.props.match.params.date) { return toMoment(); }
    return toMoment(this.props.match.params.date, monthPattern);
  }

  public render() {
    const date = this.getDate();
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
