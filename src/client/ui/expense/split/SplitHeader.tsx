import { Box, Group, Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Money } from 'shared/util';

import { Caption } from '../../design/Text';

export const SplitHeader: React.FC<{ expense: UserExpense }> = ({ expense }) => (
  <Box pb="md">
    <Group justify="space-between" align="flex-end" w="100%" wrap="nowrap">
      <Text fw={500} flex={1} miw={0} truncate>
        {expense.title}
      </Text>
      <Text fz="lg" fw={500} pl="md">
        {Money.from(expense.sum).format()}
      </Text>
    </Group>
    <Caption>Pilko kirjaus osiin</Caption>
  </Box>
);
