import { ActionIcon, Group, GroupProps } from '@mantine/core';
import * as React from 'react';

import { ExpenseDivision, RecurrencePeriod, UserExpense } from 'shared/expense';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { invalidateExpenseData, queryClient } from 'client/data/query';
import { QueryKeys } from 'client/data/queryKeys';
import { useSourceMap } from 'client/data/SessionStore';
import { createNewExpense, splitExpense } from 'client/data/State';
import { logger } from 'client/Logger';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { Icons } from 'client/ui/icons/Icons';
import { executeOperation } from 'client/util/ExecuteOperation';

import { getBenefitorsForExpense } from '../dialog/ExpenseDialogData';
import { expenseName } from '../ExpenseHelper';

type ExpenseInfoToolsProps = {
  expense: UserExpense;
  division: ExpenseDivision;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
} & GroupProps;

export const ExpenseInfoTools: React.FC<ExpenseInfoToolsProps> = ({
  expense,
  division,
  onModify,
  onDelete,
  ...props
}) => {
  const sourceMap = useSourceMap()!;

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
        postProcess: () => {
          invalidateExpenseData();
          queryClient.invalidateQueries({ queryKey: QueryKeys.subscriptions.all });
        },
      });
    }
  };

  const onCopy = () => {
    const e = expense;
    logger.info({ expense: e, division }, 'Copying expense');
    createNewExpense({
      title: e.title,
      sum: Money.from(e.sum).toString(),
      receiver: e.receiver,
      type: e.type,
      description: e.description || undefined,
      date: e.date,
      benefit: getBenefitorsForExpense(e, division, sourceMap),
      categoryId: e.categoryId,
      sourceId: e.sourceId,
      confirmed: e.confirmed,
    });
  };

  return (
    <Group gap="xs" {...props}>
      <ActionIcon title="Pilko" onClick={() => splitExpense(expense.id)}>
        <Icons.Split />
      </ActionIcon>
      <ActionIcon title="Kopioi" onClick={onCopy}>
        <Icons.Copy />
      </ActionIcon>
      {expense.subscriptionId ? null : (
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
