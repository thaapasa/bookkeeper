import { DateTime } from 'luxon';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { toDayjs } from 'shared/time';

import { WeekHeaderRow } from './WeekHeaderRow';

interface ExpenseRowSeparatorProps {
  prev: UserExpense | null;
  next: UserExpense | null;
}

export const ExpenseRowSeparator: React.FC<ExpenseRowSeparatorProps> = ({ next, prev }) => {
  const output: React.JSX.Element[] = [];
  const showWeeks = weeksToShow(prev, next);

  output.push(...showWeeks.map(w => <WeekHeaderRow key={w} week={w} />));

  return <>{output}</>;
};

function weeksToShow(prev: UserExpense | null, next: UserExpense | null): string[] {
  if (!prev) {
    if (!next) {
      // Empty month, cannot show anything as there is no data
      return [];
    }

    if (!prev) {
      // This is the first item in the list, so render weeks from the beginning of the month
      return weeksBetween(toDayjs(next.date).startOf('month'), next.date, true);
    }
  }

  return weeksBetween(prev.date, next ? next.date : toDayjs(prev.date).endOf('month'), false);
}

const toWeek = (m: DateTime) => {
  return String(m.weekNumber);
};

function weeksBetween(a: string | DateTime, b: string | DateTime, includeFirst: boolean) {
  const weeks: string[] = [];
  let weekStart = toDayjs(a).startOf('week');
  if (includeFirst) {
    weeks.push(toWeek(weekStart));
  }
  const bDateTime = toDayjs(b);
  do {
    weekStart = weekStart.plus({ weeks: 1 });
    if (weekStart <= bDateTime) {
      weeks.push(toWeek(weekStart));
    }
  } while (weekStart <= bDateTime);
  return weeks;
}
