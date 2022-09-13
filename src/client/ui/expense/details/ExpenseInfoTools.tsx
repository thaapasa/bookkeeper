import { IconButton } from '@mui/material';
import * as B from 'baconjs';
import debug from 'debug';
import * as React from 'react';
import styled from 'styled-components';

import { ExpenseDivision, UserExpense } from 'shared/types/Expense';
import { Category, Source } from 'shared/types/Session';
import Money from 'shared/util/Money';
import { RecurrencePeriod } from 'shared/util/Recurrence';
import { ISODatePattern, toDate, toMoment } from 'shared/util/Time';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';
import { sourceMapE } from 'client/data/Login';
import {
  createNewExpense,
  notify,
  notifyError,
  splitExpense,
  updateExpenses,
} from 'client/data/State';
import * as colors from 'client/ui/Colors';
import { connect } from 'client/ui/component/BaconConnect';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { Copy, Delete, Edit, Repeat, Split } from 'client/ui/Icons';
import { media } from 'client/ui/Styles';

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
  toolIcon: {
    color: colors.tool,
    fontSize: '15pt',
  },
};

const ExpenseInfoToolsImpl: React.FC<RecurrenceInfoProps> = ({
  expense,
  onModify,
  onDelete,
  ...props
}) => {
  const createRecurring = async () => {
    try {
      const period = await UserPrompts.select<RecurrencePeriod>(
        'Muuta toistuvaksi',
        `Kuinka usein kirjaus ${expenseName(expense)} toistuu?`,
        [
          { label: 'Viikoittain', value: { amount: 1, unit: 'weeks' } },
          { label: 'Kuukausittain', value: { amount: 1, unit: 'months' } },
          {
            label: 'Kvartaaleittain',
            value: { amount: 1, unit: 'quarters' },
          },
          { label: 'Vuosittain', value: { amount: 1, unit: 'years' } },
        ]
      );
      if (period) {
        await apiConnect.createRecurring(expense.id, period);
        updateExpenses(toDate(expense.date));
        notify('Kirjaus muutettu toistuvaksi');
      }
    } catch (e) {
      notifyError('Virhe muutettaessa kirjausta toistuvaksi', e);
    }
  };

  const onCopy = () => {
    const e = expense;
    const division = props.division;
    const cat = props.categoryMap[e.categoryId];
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
      benefit: getBenefitorsForExpense(e, division, props.sourceMap),
      categoryId,
      subcategoryId,
      sourceId: e.sourceId,
      confirmed: e.confirmed,
    });
  };

  return (
    <ToolContainer>
      <ToolIconButton title="Pilko" onClick={() => splitExpense(expense.id)}>
        <Split style={styles.toolIcon} />
      </ToolIconButton>
      <ToolIconButton title="Kopioi" onClick={onCopy}>
        <Copy style={styles.toolIcon} />
      </ToolIconButton>
      {expense.recurringExpenseId ? null : (
        <ToolIconButton title="Muuta toistuvaksi" onClick={createRecurring}>
          <Repeat style={styles.toolIcon} />
        </ToolIconButton>
      )}
      <MobileTools>
        <ToolIconButton title="Muokkaa" onClick={() => onModify(expense)}>
          <Edit style={styles.toolIcon} />
        </ToolIconButton>
        <ToolIconButton title="Poista" onClick={() => onDelete(expense)}>
          <Delete style={styles.toolIcon} />
        </ToolIconButton>
      </MobileTools>
    </ToolContainer>
  );
};

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
    position: absolute;
    right: 0;
    top: 40px;
  `}
`;

export const ExpenseInfoTools = connect(
  B.combineTemplate({ categoryMap: categoryMapE, sourceMap: sourceMapE })
)(ExpenseInfoToolsImpl);

export const ToolIconButton = styled(IconButton)`
  margin: 0px;
  padding: 0px;
  width: 36px;
  height: 36px;
`;
