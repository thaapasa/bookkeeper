import { IconButton, styled } from '@mui/material';
import * as B from 'baconjs';
import debug from 'debug';
import * as React from 'react';

import { ExpenseDivision, RecurrencePeriod, UserExpense } from 'shared/expense';
import { ISODatePattern, toDate, toMoment } from 'shared/time';
import { CategoryMap, Source } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';
import { sourceMapE } from 'client/data/Login';
import { createNewExpense, splitExpense, updateExpenses } from 'client/data/State';
import * as colors from 'client/ui/Colors';
import { connect } from 'client/ui/component/BaconConnect';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { Icons } from 'client/ui/icons/Icons';
import { media } from 'client/ui/Styles';
import { executeOperation } from 'client/util/ExecuteOperation';

import { getBenefitorsForExpense } from '../dialog/ExpenseDialogData';
import { expenseName } from '../ExpenseHelper';

const log = debug('bookkeeper:expense');

interface RecurrenceInfoProps {
  expense: UserExpense;
  division: ExpenseDivision;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
  categoryMap: CategoryMap;
  sourceMap: Record<string, Source>;
}

const styles = {
  toolIcon: {
    color: colors.tool,
    fontSize: '15pt',
  },
};

const ExpenseInfoToolsImpl: React.FC<RecurrenceInfoProps> = ({ expense, onModify, onDelete, ...props }) => {
  const createRecurring = async () => {
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
        { label: 'Puolivuosittain', value: { amount: 6, unit: 'months' } },
      ],
    );
    if (period) {
      await executeOperation(() => apiConnect.createRecurring(expense.id, period), {
        success: 'Kirjaus muutettu toistuvaksi',
        postProcess: () => updateExpenses(toDate(expense.date)),
      });
    }
  };

  const onCopy = () => {
    const e = expense;
    const division = props.division;
    const cat = props.categoryMap[e.categoryId];
    const subcategoryId = (cat.parentId && e.categoryId) || undefined;
    const categoryId = (subcategoryId ? cat.parentId : e.categoryId) || undefined;
    const date = toMoment(e.date, ISODatePattern);
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
        <Icons.Split style={styles.toolIcon} />
      </ToolIconButton>
      <ToolIconButton title="Kopioi" onClick={onCopy}>
        <Icons.Copy style={styles.toolIcon} />
      </ToolIconButton>
      {expense.recurringExpenseId ? null : (
        <ToolIconButton title="Muuta toistuvaksi" onClick={createRecurring}>
          <Icons.Repeat style={styles.toolIcon} />
        </ToolIconButton>
      )}
      <MobileTools>
        <ToolIconButton title="Muokkaa" onClick={() => onModify(expense)}>
          <Icons.Edit style={styles.toolIcon} />
        </ToolIconButton>
        <ToolIconButton title="Poista" onClick={() => onDelete(expense)}>
          <Icons.Delete style={styles.toolIcon} />
        </ToolIconButton>
      </MobileTools>
    </ToolContainer>
  );
};

const ToolContainer = styled('div')`
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-direction: row;
`;

const MobileTools = styled('div')`
  display: none;
  ${media.mobile`
    display: flex;
    flex-direction: row;
    position: absolute;
    right: 0;
    top: 40px;
  `}
`;

export const ExpenseInfoTools = connect(B.combineTemplate({ categoryMap: categoryMapE, sourceMap: sourceMapE }))(
  ExpenseInfoToolsImpl,
);

export const ToolIconButton = styled(IconButton)`
  margin: 0px;
  padding: 0px;
  width: 36px;
  height: 36px;
`;
