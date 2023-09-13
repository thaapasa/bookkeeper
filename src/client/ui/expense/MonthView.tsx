import debug from 'debug';
import { Moment } from 'moment';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { UserExpense } from 'shared/expense';
import { ISODate, ISODatePattern, isSameMonth, monthRange, toISODate, toMoment } from 'shared/time';
import apiConnect from 'client/data/ApiConnect';
import { navigationBus, needUpdateE } from 'client/data/State';
import { expensePagePath, expensesForMonthPath } from 'client/util/Links';

import { useDeferredData } from '../hooks/useAsyncData';
import { zeroStatus } from './ExpenseHelper';
import ExpenseTable from './ExpenseTable';
const log = debug('bookkeeper:month-view');

interface MonthViewProps {
  date: Date;
}

const zeroStatuses = {
  startStatus: zeroStatus,
  endStatus: zeroStatus,
  monthStatus: zeroStatus,
};

const noExpenses: UserExpense[] = [];

export const MonthView: React.FC<MonthViewProps> = ({ date }) => {
  const isoDate = toISODate(date);
  const { data, loadData } = useDeferredData(loadExpensesForDate, true, isoDate);
  React.useEffect(loadData, [loadData]);

  const statuses = React.useMemo(
    () =>
      data.type === 'loaded'
        ? {
            startStatus: data.value.startStatus,
            endStatus: data.value.endStatus,
            monthStatus: data.value.monthStatus,
          }
        : zeroStatuses,
    [data],
  );
  const expenseResponse = data.type === 'loaded' ? data.value : undefined;
  const loadedExpenseArray = expenseResponse?.expenses;

  const [localExpenses, setExpenses] = React.useState<UserExpense[] | undefined>(undefined);

  // React hack to auto-update local state to localExpenses array
  // whenever loaded data changed, but also to be able to read
  // it right away. We can set it directly as it's our internal state.
  let expenses = localExpenses;
  if (data.type === 'loaded') {
    if (localExpenses !== loadedExpenseArray) {
      setExpenses(loadedExpenseArray);
      expenses = loadedExpenseArray;
    }
  } else {
    if (localExpenses !== undefined) {
      setExpenses(undefined);
      expenses = undefined;
    }
  }

  const navigate = useNavigate();
  React.useEffect(
    () =>
      needUpdateE.onValue((newDate: Moment) => {
        log('Expenses updated, refreshing for date', toISODate(newDate));
        if (isSameMonth(newDate, date)) {
          log('Reloading expenses for this month');
          loadData();
        } else {
          const path = expensesForMonthPath(newDate);
          log('Navigating to', path);
          navigate(path);
        }
      }),
    [loadData, navigate, date],
  );

  return (
    <ExpenseTable
      expenses={expenses ?? noExpenses}
      loading={data.type === 'loading'}
      startStatus={statuses.startStatus}
      endStatus={statuses.endStatus}
      monthStatus={statuses.monthStatus}
      unconfirmedBefore={expenseResponse?.unconfirmedBefore ?? false}
      onUpdateExpense={(id, data) =>
        expenses ? setExpenses(expenses.map(e => (e.id === id ? data : e))) : undefined
      }
      dateBorder={true}
    />
  );
};

async function loadExpensesForDate(date: ISODate) {
  const m = toMoment(date, ISODatePattern);
  navigationBus.push({
    dateRange: monthRange(m),
    pathPrefix: expensePagePath,
  });
  const expenses = await apiConnect.getExpensesForMonth(m.get('year'), m.get('month') + 1);
  log('Expenses for', date, expenses);
  return expenses;
}
