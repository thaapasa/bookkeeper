import { Group } from '@mantine/core';
import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';

import { TotalSum } from './TotalSum';

interface TotalsViewProps {
  results: UserExpense[];
}

export const TotalsView: React.FC<TotalsViewProps> = ({ results }) => {
  const totals = calculateTotals(results);
  return (
    <Group gap="xl" px={{ base: 'xs', sm: 'md' }} py="md" fz="sm">
      <TotalSum label="Yhteensä" sum={totals.total} />
      <TotalSum label="Tulot" sum={totals.income} visibleFrom="xs" />
      <TotalSum label="Menot" sum={totals.expense} visibleFrom="xs" />
      <TotalSum label="Siirrot" sum={totals.transfer} visibleFrom="sm" />
    </Group>
  );
};
