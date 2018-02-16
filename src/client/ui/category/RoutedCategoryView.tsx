import * as React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { categoryViewYearPattern, categoryViewMonthPattern } from '../../util/Links';
import { RouteComponentProps } from 'react-router';
import CategoryView from './CategoryView';
import { yearRange, monthRange, TypedDateRange } from '../../../shared/util/Time';

interface CategoryRouteParams {
  year?: string;
  month?: string;
}

class RoutedCategoryView extends React.Component<RouteComponentProps<CategoryRouteParams>, {}> {
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

export default class CategoryViewWrapper extends React.Component<{}, {}> {
  public render() {
    return (
      <Router>
        <Switch>
          <Route path={categoryViewYearPattern('year')} component={RoutedCategoryView} />
          <Route path={categoryViewMonthPattern('month')} component={RoutedCategoryView} />
          <Route path="" component={RoutedCategoryView} />
        </Switch>
      </Router>
    );
  }
}
