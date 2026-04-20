import * as React from 'react';
import { Route, Routes } from 'react-router';

import {
  categoryPagePath,
  categoryViewMonthPattern,
  categoryViewYearPattern,
  expenseMonthPathPattern,
  expensePagePath,
  groupingsPagePath,
  infoPagePath,
  profilePagePath,
  searchPagePath,
  shortcutsPagePath,
  statisticsPage,
  subscriptionsPagePath,
  toolsPagePath,
  trackingPagePath,
} from 'client/util/Links';

import { RoutedCategoryPage } from '../category/RoutedCategoryPage';
import { QueryBoundary } from '../component/QueryBoundary';
import { RoutedMonthlyExpensesPage } from '../expense/RoutedMonthlyExpensesPage';
import { PathNotFoundError } from '../general/ErrorView';
import { ShortcutsPage } from '../general/ShortcutsPage';
import { GroupingExpensesPage } from '../grouping/GroupingExpensesPage';
import { GroupingPage } from '../grouping/GroupingPage';
import { InfoView } from '../info/InfoView';
import { ProfileView } from '../profile/ProfileView';
import { SearchPage } from '../search/SearchPage';
import { StatisticsView } from '../statistics/StatisticsView';
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage';
import { ToolsView } from '../tools/ToolsView';
import { TrackingPage } from '../tracking/TrackingPage';

function qb(children: React.ReactNode) {
  return <QueryBoundary>{children}</QueryBoundary>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path={expenseMonthPathPattern('date') + '/*'}
        element={qb(<RoutedMonthlyExpensesPage />)}
      />
      <Route path={expensePagePath + '/*'} element={qb(<RoutedMonthlyExpensesPage />)} />
      <Route path={categoryViewYearPattern('year')} element={qb(<RoutedCategoryPage />)} />
      <Route path={categoryViewMonthPattern('month')} element={qb(<RoutedCategoryPage />)} />
      <Route path={shortcutsPagePath + '/*'} element={<ShortcutsPage />} />
      <Route path={subscriptionsPagePath} element={qb(<SubscriptionsPage />)} />
      <Route path={categoryPagePath} element={qb(<RoutedCategoryPage />)} />
      <Route path={`${searchPagePath}/m/:month`} element={qb(<SearchPage />)} />
      <Route path={`${searchPagePath}/y/:year`} element={qb(<SearchPage />)} />
      <Route path={searchPagePath} element={qb(<SearchPage />)} />

      <Route path={statisticsPage} element={qb(<StatisticsView />)} />
      <Route path={profilePagePath + '/*'} element={<ProfileView />} />
      <Route path={infoPagePath} element={<InfoView />} />
      <Route path={trackingPagePath} element={qb(<TrackingPage />)} />
      <Route path={groupingsPagePath} element={qb(<GroupingPage />)} />
      <Route path={`${groupingsPagePath}/:groupingId`} element={qb(<GroupingExpensesPage />)} />
      <Route path={toolsPagePath} element={<ToolsView />} />
      <Route path={'/p/*'} element={<RoutedMonthlyExpensesPage />} />
      <Route path="/" element={<RoutedMonthlyExpensesPage />} />
      <Route path="/*" element={<PathNotFoundError />} />
    </Routes>
  );
}
