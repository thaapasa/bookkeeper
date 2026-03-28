import { ActionIcon, Group } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { ExpenseDivision, RecurrencePeriod, UserExpense } from 'shared/expense';
import { ISODatePattern, toDate, toDateTime } from 'shared/time';
import { CategoryMap, Source } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapP } from 'client/data/Categories';
import { sourceMapP } from 'client/data/Login';
import { createNewExpense, splitExpense, updateExpenses } from 'client/data/State';
import { logger } from 'client/Logger';
import { connect } from 'client/ui/component/BaconConnect';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { Icons } from 'client/ui/icons/Icons';
import { executeOperation } from 'client/util/ExecuteOperation';

import { getBenefitorsForExpense } from '../dialog/ExpenseDialogData';
import { expenseName } from '../ExpenseHelper';

interface RecurrenceInfoProps {
  expense: UserExpense;
  division: ExpenseDivision;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
  categoryMap: CategoryMap;
  sourceMap: Record<string, Source>;
}

const ExpenseInfoToolsImpl: React.FC<RecurrenceInfoProps> = ({
  expense,
  onModify,
  onDelete,
  ...props
}) => {
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
    const date = toDateTime(e.date, ISODatePattern);
    logger.info({ expense: e, division }, 'Copying expense');
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
    <Group pos="absolute" right={8} top={8} gap="xs">
      <ActionIcon title="Pilko" onClick={() => splitExpense(expense.id)}>
        <Icons.Split />
      </ActionIcon>
      <ActionIcon title="Kopioi" onClick={onCopy}>
        <Icons.Copy />
      </ActionIcon>
      {expense.recurringExpenseId ? null : (
        <ActionIcon title="Muuta toistuvaksi" onClick={createRecurring}>
          <Icons.Repeat />
        </ActionIcon>
      )}
      <ActionIcon title="Muokkaa" hiddenFrom="sm" onClick={() => onModify(expense)}>
        <Icons.Edit />
      </ActionIcon>
      <ActionIcon title="Poista" hiddenFrom="sm" onClick={() => onDelete(expense)}>
        <Icons.Delete />
      </ActionIcon>
    </Group>
  );
};

export const ExpenseInfoTools = connect(
  B.combineTemplate({ categoryMap: categoryMapP, sourceMap: sourceMapP }),
)(ExpenseInfoToolsImpl);
