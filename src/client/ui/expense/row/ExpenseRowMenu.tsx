import { ActionIcon, Menu } from '@mantine/core';
import * as React from 'react';

import { RecurrencePeriod, RecurringExpenseTarget, UserExpense } from 'shared/expense';
import { Money } from 'shared/util';
import { apiConnect } from 'client/data/ApiConnect';
import { notify } from 'client/data/NotificationStore';
import { invalidateServerData } from 'client/data/query';
import { useSourceMap } from 'client/data/SessionStore';
import { createNewExpense, editExpense, splitExpense } from 'client/data/State';
import { logger } from 'client/Logger';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { Icons } from 'client/ui/icons/Icons';
import { executeOperation } from 'client/util/ExecuteOperation';

import { getBenefitorsForExpense } from '../dialog/ExpenseDialogData';
import { expenseName } from '../ExpenseHelper';

export const ExpenseRowMenu: React.FC<{ expense: UserExpense }> = ({ expense }) => {
  const sourceMap = useSourceMap()!;

  const modifyExpense = async () => {
    const e = await apiConnect.getExpense(expense.id);
    // The dialog's own save flow invalidates data and navigates to the saved
    // expense, so we just wait for the user to finish editing.
    await editExpense(e.id);
  };

  const copyExpense = async () => {
    const e = await apiConnect.getExpense(expense.id);
    logger.info({ expense: e }, 'Copying expense');
    createNewExpense({
      title: e.title,
      sum: Money.from(e.sum).toString(),
      receiver: e.receiver,
      type: e.type,
      description: e.description || undefined,
      date: e.date,
      benefit: getBenefitorsForExpense(e, e.division, sourceMap),
      categoryId: e.categoryId,
      sourceId: e.sourceId,
      confirmed: e.confirmed,
    });
  };

  const createRecurring = async () => {
    const period = await UserPrompts.select<RecurrencePeriod>(
      'Muuta toistuvaksi',
      `Kuinka usein kirjaus ${expenseName(expense)} toistuu?`,
      [
        { label: 'Viikoittain', value: { amount: 1, unit: 'weeks' } },
        { label: 'Kuukausittain', value: { amount: 1, unit: 'months' } },
        { label: 'Joka toinen kuukausi', value: { amount: 2, unit: 'months' } },
        { label: 'Kvartaaleittain', value: { amount: 1, unit: 'quarters' } },
        { label: 'Puolivuosittain', value: { amount: 6, unit: 'months' } },
        { label: 'Vuosittain', value: { amount: 1, unit: 'years' } },
      ],
    );
    if (!period) return;
    await executeOperation(() => apiConnect.createRecurring(expense.id, period), {
      success: 'Kirjaus muutettu toistuvaksi',
      postProcess: () => invalidateServerData(),
    });
  };

  const linkSplitExpense = async () => {
    const sameDay = await apiConnect.searchExpenses({
      startDate: expense.date,
      endDate: expense.date,
    });
    const candidates = sameDay.filter(
      e =>
        e.id !== expense.id &&
        !e.subscriptionId &&
        (expense.splitId === null || e.splitId !== expense.splitId),
    );
    if (candidates.length < 1) {
      notify('Ei muita kirjauksia samalta päivältä');
      return;
    }
    const targetId = await UserPrompts.selectFromList(
      'Linkitä pilkotut kirjaukset',
      `Valitse kirjaus, joka on pilkottu samasta kirjauksesta kuin ${expenseName(expense)}:`,
      candidates.map(e => ({
        value: String(e.id),
        label: expenseName(e),
      })),
    );
    if (!targetId) return;
    await executeOperation(() => apiConnect.linkSplitExpenses(expense.id, Number(targetId)), {
      success: 'Kirjaukset linkitetty pilkotuiksi',
      postProcess: () => invalidateServerData(),
    });
  };

  const unlinkSplitExpense = async () => {
    await executeOperation(() => apiConnect.unlinkSplitExpense(expense.id), {
      success: 'Pilkkomislinkitys poistettu',
      postProcess: () => invalidateServerData(),
    });
  };

  const deleteExpense = async () => {
    const name = expenseName(expense);
    if (expense.subscriptionId) {
      const target = await UserPrompts.select<RecurringExpenseTarget>(
        'Poista toistuva kirjaus',
        `Haluatko varmasti poistaa kirjauksen ${name}?`,
        [
          { label: 'Vain tämä', value: 'single' },
          { label: 'Kaikki', value: 'all' },
          { label: 'Tästä eteenpäin', value: 'after' },
        ],
      );
      if (!target) return;
      await executeOperation(() => apiConnect.deleteRecurringById(expense.id, target), {
        success: `Poistettu kirjaus ${name}`,
        postProcess: () => invalidateServerData(),
      });
      return;
    }
    await executeOperation(() => apiConnect.deleteExpense(expense.id), {
      confirmTitle: 'Poista kirjaus',
      confirm: `Haluatko varmasti poistaa kirjauksen ${name}?`,
      success: `Poistettu kirjaus ${name}`,
      postProcess: () => invalidateServerData(),
    });
  };

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <ActionIcon aria-label="Toiminnot" title="Toiminnot">
          <Icons.More />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<Icons.Edit size={16} />} onClick={modifyExpense}>
          Muokkaa…
        </Menu.Item>
        {expense.subscriptionId ? null : (
          <Menu.Item
            leftSection={<Icons.Split size={16} />}
            onClick={() => splitExpense(expense.id)}
          >
            Pilko
          </Menu.Item>
        )}
        <Menu.Item leftSection={<Icons.Copy size={16} />} onClick={copyExpense}>
          Kopioi
        </Menu.Item>
        {expense.subscriptionId ? null : (
          <Menu.Item leftSection={<Icons.Link size={16} />} onClick={linkSplitExpense}>
            Linkitä pilkotuksi…
          </Menu.Item>
        )}
        {expense.splitId ? (
          <Menu.Item leftSection={<Icons.Unlink size={16} />} onClick={unlinkSplitExpense}>
            Poista pilkkomislinkitys
          </Menu.Item>
        ) : null}
        {/* Hidden for split-linked rows too: an expense cannot be both
            subscription-generated and split-linked (unlink first). */}
        {expense.subscriptionId || expense.splitId ? null : (
          <Menu.Item leftSection={<Icons.Repeat size={16} />} onClick={createRecurring}>
            Muuta toistuvaksi
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item leftSection={<Icons.Delete size={16} />} color="red" onClick={deleteExpense}>
          Poista
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
