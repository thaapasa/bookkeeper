import moment from 'moment';
import * as React from 'react';

import { UserExpense } from 'shared/types/Expense';
import { toMoment } from 'shared/util/Time';

import { WeekHeaderRow } from './WeekHeaderRow';

interface ExpenseRowSeparatorProps {
  prev: UserExpense | null;
  next: UserExpense | null;
}

export const ExpenseRowSeparator: React.FC<ExpenseRowSeparatorProps> = ({
  next,
  prev,
}) => {
  const output: JSX.Element[] = [];
  const showWeeks = weeksToShow(prev, next);

  output.push(...showWeeks.map((w, i) => <WeekHeaderRow key={i} week={w} />));

  return <>{output}</>;
};

function weeksToShow(
  prev: UserExpense | null,
  next: UserExpense | null
): string[] {
  if (!prev) {
    if (!next) {
      // Empty month, cannot show anything as there is no data
      return [];
    }

    if (!prev) {
      // This is the first item in the list, so render weeks from the beginning of the month
      return weeksBetween(
        toMoment(next.date).startOf('month'),
        next.date,
        true
      );
    }
  }

  return weeksBetween(
    prev.date,
    next ? next.date : toMoment(prev.date).endOf('month'),
    false
  );
}

const toWeek = (m: moment.Moment) => {
  return m.format('WW');
};

function weeksBetween(
  a: string | moment.Moment,
  b: string | moment.Moment,
  includeFirst: boolean
) {
  const weeks: string[] = [];
  let weekStart = toMoment(a).startOf('week');
  if (includeFirst) {
    weeks.push(toWeek(weekStart));
  }
  do {
    weekStart = weekStart.add(1, 'week');
    if (weekStart.isSameOrBefore(b)) {
      weeks.push(toWeek(weekStart));
    }
  } while (weekStart.isSameOrBefore(b));
  return weeks;
}
