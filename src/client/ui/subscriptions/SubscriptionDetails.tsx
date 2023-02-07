import * as React from 'react';

import { RecurringExpenseDetails } from 'shared/expense';
import { readableDateWithYear, toDate, toMoment } from 'shared/time';
import { ObjectId } from 'shared/types';
import { Money, spaced } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { needUpdateE, updateExpenses } from 'client/data/State';
import { executeOperation } from 'client/util/ExecuteOperation';

import { AsyncDataView } from '../component/AsyncDataView';
import { useDeferredData } from '../hooks/useAsyncData';
import { ToolIcon } from '../icons/ToolIcon';
import { Label, RowElement, Tools } from './layout';

export const SubscriptionDetails: React.FC<{ recurringExpenseId: number }> = ({
  recurringExpenseId,
}) => {
  const { data, loadData } = useDeferredData(
    apiConnect.getSubscription,
    true,
    recurringExpenseId
  );
  React.useEffect(loadData, [loadData, recurringExpenseId]);
  React.useEffect(() => needUpdateE.onValue(loadData), [loadData]);
  return (
    <AsyncDataView
      hideUninitialized
      data={data}
      renderer={SubscriptionDetailsRenderer}
    />
  );
};

const SubscriptionDetailsRenderer: React.FC<{
  data: RecurringExpenseDetails;
  className?: string;
}> = ({ data, className }) => {
  const exp = data.recurringExpense;
  const active = !exp.occursUntil;

  return (
    <RowElement className={spaced`${className} ${!active && 'inactive'}`}>
      <Label>
        <>
          {getLabel(data)}.
          {exp.occursUntil
            ? ` Tilaus on päättynyt ${readableDateWithYear(exp.occursUntil)}.`
            : ` Seuraava kirjaus ${readableDateWithYear(exp.nextMissing)}.`}
        </>
      </Label>
      <Tools>
        {active ? (
          <ToolIcon
            className="optional"
            title="Poista"
            onClick={() => terminateSubscription(exp.id, exp.title)}
            icon="Delete"
          />
        ) : null}
      </Tools>
    </RowElement>
  );
};

function getLabel({
  totalExpenses: num,
  totalSum: sum,
  firstOccurence: first,
  lastOccurence: last,
}: RecurringExpenseDetails) {
  if (num === 0) {
    return 'Ei tapahtumia';
  }
  return `${num} tapahtuma${
    num === 1
      ? ` ${readableDateWithYear(first?.date)}`
      : `a päivinä ${readableDateWithYear(
          first?.date
        )} - ${readableDateWithYear(last?.date)}`
  }: ${Money.from(sum).format()}`;
}

async function terminateSubscription(
  recurringExpenseId: ObjectId,
  title: string
) {
  executeOperation(() => apiConnect.deleteSubscription(recurringExpenseId), {
    confirm: `Haluatko lopettaa tilauksen ${title}?`,
    progress: 'Lopetetaan tilausta...',
    success: 'Tilaus lopetettu!',
    postProcess: () => updateExpenses(toDate(toMoment())),
  });
}
