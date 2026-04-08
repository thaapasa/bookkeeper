import { ActionIcon, Group } from '@mantine/core';
import * as React from 'react';

import { RecurringExpenseDetails } from 'shared/expense';
import { readableDateWithYear, toISODate } from 'shared/time';
import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { editExpense, needUpdateE, updateExpenses } from 'client/data/State';
import { executeOperation } from 'client/util/ExecuteOperation';

import { AsyncDataView } from '../component/AsyncDataView';
import { useDeferredData } from '../hooks/useAsyncData';
import { Icons } from '../icons/Icons';
import { Label, SubscriptionRow, Tools } from './SubscriptionLayout';

export const SubscriptionDetails: React.FC<{ recurringExpenseId: number }> = ({
  recurringExpenseId,
}) => {
  const { data, loadData } = useDeferredData(apiConnect.getSubscription, true, recurringExpenseId);
  React.useEffect(loadData, [loadData, recurringExpenseId]);
  React.useEffect(() => needUpdateE.onValue(loadData), [loadData]);
  return <AsyncDataView hideUninitialized data={data} renderer={SubscriptionDetailsRenderer} />;
};

const SubscriptionDetailsRenderer: React.FC<{
  data: RecurringExpenseDetails;
}> = ({ data }) => {
  const exp = data.recurringExpense;
  const active = !exp.occursUntil;

  return (
    <SubscriptionRow bg={!active ? 'neutral.1' : undefined} c={!active ? 'neutral.7' : undefined}>
      <Label>
        {getLabel(data)}.
        {exp.occursUntil
          ? ` Tilaus on päättynyt ${readableDateWithYear(exp.occursUntil)}.`
          : ` Seuraava kirjaus ${readableDateWithYear(exp.nextMissing)}.`}
      </Label>
      <Tools large>
        {active ? (
          <Group gap={2} wrap="nowrap">
            <ActionIcon title="Muokkaa" onClick={() => modifySubscription(exp.templateExpenseId)}>
              <Icons.Edit />
            </ActionIcon>
            <ActionIcon
              title="Poista"
              visibleFrom="sm"
              onClick={() => terminateSubscription(exp.id, exp.title)}
            >
              <Icons.Delete />
            </ActionIcon>
          </Group>
        ) : null}
      </Tools>
    </SubscriptionRow>
  );
};

function getLabel({
  totalExpenses: num,
  totalSum: sum,
  firstOccurence: first,
  lastOccurence: last,
}: RecurringExpenseDetails): string {
  if (num === 0) {
    return 'Ei tapahtumia';
  }
  return `${num} tapahtuma${
    num === 1
      ? ` ${readableDateWithYear(first?.date)}`
      : `a päivinä ${readableDateWithYear(first?.date)} - ${readableDateWithYear(last?.date)}`
  }: ${Money.from(sum).format()}`;
}

async function terminateSubscription(recurringExpenseId: ObjectId, title: string) {
  executeOperation(() => apiConnect.deleteSubscription(recurringExpenseId), {
    confirm: `Haluatko lopettaa tilauksen ${title}?`,
    progress: 'Lopetetaan tilausta...',
    success: 'Tilaus lopetettu!',
    postProcess: () => updateExpenses(toISODate()),
  });
}

async function modifySubscription(expenseId: ObjectId) {
  await editExpense(expenseId, {
    saveAction: async data => {
      await apiConnect.updateSubscriptionTemplate(expenseId, data);
      return true;
    },
  });
}
