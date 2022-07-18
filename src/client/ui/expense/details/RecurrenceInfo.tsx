import * as React from 'react';
import styled from 'styled-components';
import { UserExpense } from 'shared/types/Expense';
import * as colors from '../../Colors';

interface RecurrenceInfoProps {
  expense: UserExpense;
}

export default class RecurrenceInfo extends React.Component<RecurrenceInfoProps> {
  public render() {
    return this.props.expense.recurringExpenseId ? (
      <RecurrenceInfoContainer>
        Tämä on toistuva tapahtuma
      </RecurrenceInfoContainer>
    ) : null;
  }
}

const RecurrenceInfoContainer = styled.div`
  width: 100%;
  padding: 12px 16px;
  background-color: ${colors.colorScheme.gray.light};
  font-style: italic;
`;
