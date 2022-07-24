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
import * as colors from 'client/ui/Colors';
import { connect } from 'client/ui/component/BaconConnect';
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

const ExpenseInfoTools: React.FC<RecurrenceInfoProps> = ({
  expense,
  onModify,
  onDelete,
  ...props
}) => {
  const createRecurring = async () => {
    try {
      const period = await confirm<RecurringExpensePeriod | undefined>(
        'Muuta toistuvaksi',
        `Kuinka usein kirjaus ${expenseName(expense)} toistuu?`,
        {
          actions: [
            { label: 'Kuukausittain', value: 'monthly' },
            { label: 'Vuosittain', value: 'yearly' },
            { label: 'Peruuta', value: undefined },
          ],
        }
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
      <ToolIconButton title="Pilko" onClick={() => undefined}>
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
  `}
`;

export default connect(
  B.combineTemplate({ categoryMap: categoryMapE, sourceMap: sourceMapE })
)(ExpenseInfoTools);

export const ToolIconButton = styled(IconButton)`
  margin: 0px;
  padding: 0px;
  width: 36px;
  height: 36px;
`;
