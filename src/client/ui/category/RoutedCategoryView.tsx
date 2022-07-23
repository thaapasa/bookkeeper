import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { monthRange, TypedDateRange, yearRange } from 'shared/util/Time';

import CategoryView from './CategoryView';

interface CategoryRouteParams {
  year?: string;
  month?: string;
}

export default class RoutedCategoryView extends React.Component<
  RouteComponentProps<CategoryRouteParams>
> {
  private getDates(): TypedDateRange {
    if (this.props.match.params.year) {
      return yearRange(this.props.match.params.year);
    } else if (this.props.match.params.month) {
      return monthRange(this.props.match.params.month);
    } else {
      return yearRange(new Date());
    }
  }

  public render() {
    const range = this.getDates();
    return <CategoryView range={range} history={this.props.history} />;
  }
}
