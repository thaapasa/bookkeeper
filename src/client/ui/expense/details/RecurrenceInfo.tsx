import { Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';

interface RecurrenceInfoProps {
  expense: UserExpense;
}

export const RecurrenceInfo: React.FC<RecurrenceInfoProps> = ({ expense }) =>
  expense.recurringExpenseId ? (
    <Text bg="neutral.1" w="100%" p="12px 16px" fs="italic">
      Tämä on toistuva tapahtuma
    </Text>
  ) : null;
