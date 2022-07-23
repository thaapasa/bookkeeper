import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { toMoment } from 'shared/util/Time';
import { monthPattern } from 'client/util/Links';

import MonthView from './MonthView';

interface MonthRouteParams {
  date?: string;
}

export default class RoutedMonthView extends React.Component<
  RouteComponentProps<MonthRouteParams>
> {
  get date(): Date {
    if (!this.props.match.params.date) {
      return new Date();
    }
    return toMoment(this.props.match.params.date, monthPattern).toDate();
  }

  public render() {
    const date = this.date;
    return <MonthView date={date} history={this.props.history} />;
  }
}
