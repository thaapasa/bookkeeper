import * as React from 'react';

import { parseQueryString } from 'shared/net';
import { noop } from 'shared/util';
import { expenseDialogE } from 'client/data/State';

import { RoutedMonthView } from './RoutedMonthView';

export class NewExpenseView extends React.Component {
  componentDidMount() {
    this.openEditor();
  }

  openEditor = () => {
    const params = parseQueryString(document.location.search);
    expenseDialogE.push({
      expenseId: null,
      resolve: noop,
      values: {
        sum: params.sum,
        title: params.title,
        categoryId: params.categoryId ? Number(params.categoryId) : undefined,
        subcategoryId: params.subcategoryId ? Number(params.subcategoryId) : undefined,
        receiver: params.receiver,
        sourceId: params.sourceId ? Number(params.sourceId) : undefined,
        benefit: params.benefit ? JSON.parse(params.benefit) : undefined,
        description: params.description,
      },
    });
  };

  render() {
    return <RoutedMonthView {...this.props} />;
  }
}
