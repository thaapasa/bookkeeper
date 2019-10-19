import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { parseQueryString } from '../../util/UrlUtils';
import RoutedMonthView from './RoutedMonthView';
import { expenseDialogE } from 'client/data/State';

export class NewExpenseView extends React.Component<RouteComponentProps<{}>> {
  componentDidMount() {
    const params = parseQueryString(document.location.search);
    expenseDialogE.push({
      expenseId: null,
      resolve: () => {},
      values: {
        sum: params.sum,
        title: params.title,
        categoryId: params.categoryId ? Number(params.categoryId) : undefined,
        subcategoryId: params.subcategoryId
          ? Number(params.subcategoryId)
          : undefined,
        receiver: params.receiver,
        sourceId: params.sourceId ? Number(params.sourceId) : undefined,
        benefit: params.benefit ? JSON.parse(params.benefit) : undefined,
        description: params.description,
      },
    });
  }

  render() {
    return <RoutedMonthView {...this.props} />;
  }
}
