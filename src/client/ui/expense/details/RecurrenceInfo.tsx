import { Group, GroupProps, Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';

type RecurrenceInfoProps = {
  expense: UserExpense;
} & GroupProps;

export const RecurrenceInfo: React.FC<RecurrenceInfoProps> = ({ expense, ...props }) =>
  expense.recurringExpenseId ? (
    <Group bg="neutral.1" w="100%" px="md" py="sm" align="center" {...props}>
      <Text fs="italic">Tämä on toistuva tapahtuma</Text>
    </Group>
  ) : null;
