import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';

import { SectionLabel } from '../design/Text';
import styles from './TotalsView.module.css';

interface TotalsViewProps {
  results: UserExpense[];
}

export const TotalsView: React.FC<TotalsViewProps> = ({ results }) => {
  const totals = calculateTotals(results);
  return (
    <>
      <div className={styles.padding} />
      <div className={styles.positioner}>
        <div className={styles.totalsArea}>
          <div className={styles.total}>
            <SectionLabel component="span" mr="sm">
              Yhteensä
            </SectionLabel>
            {totals.total.format()}
          </div>
          <div className={styles.total}>
            <SectionLabel component="span" mr="sm">
              Tulot
            </SectionLabel>
            {totals.income.format()}
          </div>
          <div className={styles.total}>
            <SectionLabel component="span" mr="sm">
              Menot
            </SectionLabel>
            {totals.expense.format()}
          </div>
          <div className={styles.total}>
            <SectionLabel component="span" mr="sm">
              Siirrot
            </SectionLabel>
            {totals.transfer.format()}
          </div>
        </div>
      </div>
    </>
  );
};
