import { Dayjs } from 'dayjs';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { UserExpense } from 'shared/expense';
import { ISODate, ISODatePattern, isSameMonth, monthRange, toDayjs, toISODate } from 'shared/time';
import apiConnect from 'client/data/ApiConnect';
import { navigationBus, needUpdateE } from 'client/data/State';
import { logger } from 'client/Logger';
import { expensePagePath, expensesForMonthPath } from 'client/util/Links';

import { useDeferredData } from '../hooks/useAsyncData';
import { zeroStatus } from './ExpenseHelper';
import ExpenseTable from './ExpenseTable';

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
      needUpdateE.onValue((newDate: Dayjs) => {
        logger.info('Expenses updated, refreshing for date %s', toISODate(newDate));
        if (isSameMonth(newDate, date)) {
          logger.info('Reloading expenses for this month');
          loadData();
        } else {
          const path = expensesForMonthPath(newDate);
          logger.info('Navigating to %s', path);
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
  const m = toDayjs(date, ISODatePattern);
  navigationBus.push({
    dateRange: monthRange(m),
    pathPrefix: expensePagePath,
  });
  const expenses = await apiConnect.getExpensesForMonth(m.get('year'), m.get('month') + 1);
  logger.info(expenses, 'Expenses for %s', date);
  return expenses;
}
