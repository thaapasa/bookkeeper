import { IconButton } from '@mui/material';
import * as B from 'baconjs';
import debug from 'debug';
import * as React from 'react';
import styled from 'styled-components';

import {
  ExpenseDivision,
  RecurringExpensePeriod,
  UserExpense,
} from 'shared/types/Expense';
import { Category, Source } from 'shared/types/Session';
import Money from 'shared/util/Money';
import { ISODatePattern, toDate, toMoment } from 'shared/util/Time';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';
import { sourceMapE } from 'client/data/Login';
import {
  confirm,
  createNewExpense,
  notify,
  notifyError,
  updateExpenses,
} from 'client/data/State';

import * as colors from '../../Colors';
import { connect } from '../../component/BaconConnect';
import { Copy, Delete, Edit, Repeat } from '../../Icons';
import { media } from '../../Styles';
import { getBenefitorsForExpense } from '../dialog/ExpenseDialogData';
import { expenseName } from '../ExpenseHelper';

const log = debug('bookkeeper:expense');

interface RecurrenceInfoProps {
  expense: UserExpense;
  division: ExpenseDivision;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
  categoryMap: Record<string, Category>;
  sourceMap: Record<string, Source>;
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

class ExpenseInfoTools extends React.Component<RecurrenceInfoProps> {
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
        updateExpenses(toDate(this.props.expense.date));
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

  private onCopy = () => {
    const e = this.props.expense;
    const division = this.props.division;
    const cat = this.props.categoryMap[e.categoryId];
    const subcategoryId = (cat.parentId && e.categoryId) || undefined;
    const categoryId =
      (subcategoryId ? cat.parentId : e.categoryId) || undefined;
    const date = toMoment(e.date, ISODatePattern).toDate();
    log('Copying expense', e, division);
    createNewExpense({
      title: e.title,
      sum: Money.from(e.sum).toString(),
      receiver: e.receiver,
      type: e.type,
      description: e.description || undefined,
      date,
      benefit: getBenefitorsForExpense(e, division, this.props.sourceMap),
      categoryId,
      subcategoryId,
      sourceId: e.sourceId,
      confirmed: e.confirmed,
    });
  };

  public render() {
    return (
      <ToolContainer>
        <IconButton title="Kopioi" style={styles.tool} onClick={this.onCopy}>
          <Copy style={styles.toolIcon} />
        </IconButton>
        {this.props.expense.recurringExpenseId ? null : (
          <IconButton
            title="Muuta toistuvaksi"
            style={styles.tool}
            onClick={this.createRecurring}
          >
            <Repeat style={styles.toolIcon} />
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

export default connect(
  B.combineTemplate({ categoryMap: categoryMapE, sourceMap: sourceMapE })
)(ExpenseInfoTools);
