import * as React from 'react';

import { RecurringExpenseDetails } from 'shared/expense';
import { readableDateWithYear } from 'shared/time';
import { Money, spaced } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';

import { AsyncDataView } from '../component/AsyncDataView';
import { useAsyncData } from '../hooks/useAsyncData';
import { Label, RowElement } from './layout';

export const SubscriptionDetails: React.FC<{ recurringExpenseId: number }> = ({
  recurringExpenseId,
}) => {
  const data = useAsyncData(
    apiConnect.getRecurringExpense,
    true,
    recurringExpenseId
  );
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
  return (
    <RowElement
      className={spaced`${className} ${exp.occursUntil && 'inactive'}`}
    >
      <Label>
        <>
          {getLabel(data)}.
          {exp.occursUntil
            ? ` Tilaus on päättynyt ${readableDateWithYear(exp.occursUntil)}.`
            : ` Seuraava kirjaus ${readableDateWithYear(exp.nextMissing)}.`}
        </>
      </Label>
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
