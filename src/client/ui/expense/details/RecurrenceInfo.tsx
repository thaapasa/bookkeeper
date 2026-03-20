import styled from '@emotion/styled';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { neutral } from 'client/ui/Colors';

interface RecurrenceInfoProps {
  expense: UserExpense;
}

export const RecurrenceInfo: React.FC<RecurrenceInfoProps> = ({ expense }) =>
  expense.recurringExpenseId ? (
    <RecurrenceInfoContainer>Tämä on toistuva tapahtuma</RecurrenceInfoContainer>
  ) : null;

const RecurrenceInfoContainer = styled.div`
  width: 100%;
  padding: 12px 16px;
  background-color: ${neutral[1]};
  font-style: italic;
`;
