import { styled } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import * as colors from 'client/ui/Colors';
import { styled } from '@mui/material';

interface RecurrenceInfoProps {
  expense: UserExpense;
}

export const RecurrenceInfo: React.FC<RecurrenceInfoProps> = ({ expense }) =>
  expense.recurringExpenseId ? <RecurrenceInfoContainer>Tämä on toistuva tapahtuma</RecurrenceInfoContainer> : null;

const RecurrenceInfoContainer = styled('div')`
  width: 100%;
  padding: 12px 16px;
  background-color: ${colors.colorScheme.gray.light};
  font-style: italic;
`;
