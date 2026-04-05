import { DateTime } from 'luxon';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { uri } from 'shared/net';
import { toDateTime, toISODate } from 'shared/time';
import { createExpense, navigationP } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';
import { useBaconProperty } from '../hooks/useBaconState';
import styles from './AddExpenseIcon.module.css';
import { Icons } from './Icons';

export const AddExpenseIcon: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <div className={styles.container}>
    <div className={styles.background} />
    <Icons.PlusCircle onClick={onClick} className={styles.icon} />
  </div>
);

export const AddExpenseNavButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { dateRange } = useBaconProperty(navigationP);
  const navigate = useNavigate();
  return (
    <div className={`${styles.container} ${styles.navigation}`}>
      <div className={styles.background} />
      <Icons.PlusCircle
        onClick={onClick ?? (() => openNewExpenseDialog(navigate, dateRange.start))}
        className={`${styles.icon} ${styles.navigation}`}
      />
    </div>
  );
};

function openNewExpenseDialog(navigate: NavigateFunction, shownDay: Date) {
  const path = window.location.pathname;
  const refDay = toDateTime(shownDay);
  // Defined date if shown day is in another month. For same month, leave the date out
  const date = refDay.hasSame(DateTime.now(), 'month') ? undefined : refDay;
  if (pageSupportsRoutedExpenseDialog(path)) {
    if (!path.includes(newExpenseSuffix)) {
      const dateSuffix = date ? uri`?date=${toISODate(date)}` : '';
      navigate(
        path.startsWith('/p')
          ? path + newExpenseSuffix + dateSuffix
          : '/p' + newExpenseSuffix + dateSuffix,
      );
    }
  } else {
    createExpense({ date });
  }
}
