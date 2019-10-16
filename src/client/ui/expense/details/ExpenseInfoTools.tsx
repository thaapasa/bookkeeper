import * as React from 'react';
import styled from 'styled-components';
import { IconButton } from '@material-ui/core';
import { Repeat, Edit, Delete } from '../../Icons';
import {
  confirm,
  updateExpenses,
  notify,
  notifyError,
} from '../../../data/State';
import { expenseName } from '../ExpenseHelper';
import {
  UserExpense,
  RecurringExpensePeriod,
} from '../../../../shared/types/Expense';
import apiConnect from '../../../data/ApiConnect';
import { toDate } from '../../../../shared/util/Time';
import * as colors from '../../Colors';
import { media } from '../../Styles';

interface RecurrenceInfoProps {
  expense: UserExpense;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
}

const styles = {
  tool: {
    margin: '0',
    padding: '0',
    width: 36,
    height: 36,
  },
  toolIcon: {
    color: colors.tool,
    fontSize: '15pt',
  },
};

export default class ExpenseInfoTools extends React.Component<
  RecurrenceInfoProps
> {
  private createRecurring = async () => {
    try {
      const period = await confirm<RecurringExpensePeriod | undefined>(
        'Muuta toistuvaksi',
        `Kuinka usein kirjaus ${expenseName(this.props.expense)} toistuu?`,
        {
          actions: [
            { label: 'Kuukausittain', value: 'monthly' },
            { label: 'Vuosittain', value: 'yearly' },
            { label: 'Peruuta', value: undefined },
          ],
        }
      );
      if (period) {
        await apiConnect.createRecurring(this.props.expense.id, period);
        await updateExpenses(toDate(this.props.expense.date));
        notify('Kirjaus muutettu toistuvaksi');
      }
    } catch (e) {
      notifyError('Virhe muutettaessa kirjausta toistuvaksi', e);
    }
  };

  private onModify = () => {
    this.props.onModify(this.props.expense);
  };

  private onDelete = () => {
    this.props.onDelete(this.props.expense);
  };

  public render() {
    return (
      <ToolContainer>
        {this.props.expense.recurringExpenseId ? null : (
          <IconButton
            title="Muuta toistuvaksi"
            style={styles.tool}
            onClick={this.createRecurring}
          >
            <Repeat color={colors.tool} style={styles.toolIcon} />
          </IconButton>
        )}
        <MobileTools>
          <IconButton
            title="Muokkaa"
            style={styles.tool}
            onClick={this.onModify}
          >
            <Edit style={styles.toolIcon} />
          </IconButton>
          <IconButton
            title="Poista"
            style={styles.tool}
            onClick={this.onDelete}
          >
            <Delete style={styles.toolIcon} />
          </IconButton>
        </MobileTools>
      </ToolContainer>
    );
  }
}

const ToolContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-direction: row;
`;

const MobileTools = styled.div`
  display: none;
  ${media.mobile`
    display: flex;
    flex-direction: row;
  `}
`;
