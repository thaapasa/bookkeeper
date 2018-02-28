import * as React from 'react';
import styled from 'styled-components';
import IconButton from 'material-ui/IconButton';
import { Repeat } from '../../Icons';
import { confirm, updateExpenses, notify, notifyError } from '../../../data/State';
import { expenseName } from '../ExpenseHelper';
import { UserExpense, RecurringExpensePeriod } from '../../../../shared/types/Expense';
import apiConnect from '../../../data/ApiConnect';
import { toDate } from '../../../../shared/util/Time';
import * as colors from '../../Colors';

interface RecurrenceInfoProps {
  expense: UserExpense;
}

export default class RecurrenceInfo extends React.Component<RecurrenceInfoProps, {}> {

  private createRecurring = async () => {
    try {
      const period = await confirm<RecurringExpensePeriod | undefined>('Muuta toistuvaksi',
        `Kuinka usein kirjaus ${expenseName(this.props.expense)} toistuu?`, {
          actions: [
            { label: 'Kuukausittain', value: 'monthly'  },
            { label: 'Vuosittain', value: 'yearly' },
            { label: 'Peruuta', value: undefined },
          ],
        });
      if (period) {
        await apiConnect.createRecurring(this.props.expense.id, period);
        await updateExpenses(toDate(this.props.expense.date));
        notify('Kirjaus muutettu toistuvaksi');
      }
    } catch (e) {
      notifyError('Virhe muutettaessa kirjausta toistuvaksi', e);
    }
  }

  public render() {
    return this.props.expense.recurringExpenseId ? (
      <RecurrenceInfoContainer>Tämä on toistuva tapahtuma</RecurrenceInfoContainer>
    ) : (
      <ConvertToRecurrenceContainer>
        <IconButton onClick={this.createRecurring}><Repeat color={colors.tool} /></IconButton>
      </ConvertToRecurrenceContainer>
    );
  }

}

const RecurrenceInfoContainer = styled.div`
  width: 100%;
  padding: 12px 16px;
  background-color: ${colors.colorScheme.gray.light};
  font-style: italic;
`;

const ConvertToRecurrenceContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  margin-right: -8px;
`;
