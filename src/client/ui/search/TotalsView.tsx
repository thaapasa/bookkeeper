import { Group, Text } from '@mantine/core';
import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';

import { SectionLabel } from '../design/Text';

interface TotalsViewProps {
  results: UserExpense[];
}

export const TotalsView: React.FC<TotalsViewProps> = ({ results }) => {
  const totals = calculateTotals(results);
  return (
    <Group gap="xl" px={{ base: 'xs', sm: 'md' }} py="md" fz="sm">
      <Group gap="xs" wrap="nowrap">
        <SectionLabel component="span">Yhteensä</SectionLabel>
        <Text fz="sm">{totals.total.format()}</Text>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <SectionLabel component="span">Tulot</SectionLabel>
        <Text fz="sm">{totals.income.format()}</Text>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <SectionLabel component="span">Menot</SectionLabel>
        <Text fz="sm">{totals.expense.format()}</Text>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <SectionLabel component="span">Siirrot</SectionLabel>
        <Text fz="sm">{totals.transfer.format()}</Text>
      </Group>
    </Group>
  );
};
