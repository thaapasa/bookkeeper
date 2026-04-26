import { Box, Stack, Table, Text } from '@mantine/core';
import { useSuspenseQuery } from '@tanstack/react-query';
import * as React from 'react';

import { Subscription, SubscriptionMatchesQuery } from 'shared/expense';
import { RecurrenceInterval } from 'shared/time';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { useUserData } from 'client/data/SessionStore';

import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';

export const SubscriptionMatchesView: React.FC<{
  subscription: Subscription;
  range?: RecurrenceInterval;
}> = ({ subscription, range }) => {
  const userData = useUserData()!;
  const query = matchesQueryFor(subscription, range);
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.subscriptions.matches(query),
    queryFn: () => apiConnect.getSubscriptionMatches(query),
  });

  if (data.totalCount === 0) {
    return (
      <Box py="xs" c="neutral.7">
        <Text size="sm">Ei kirjauksia tarkasteluikkunassa.</Text>
      </Box>
    );
  }

  const truncated = data.totalCount > data.matches.length;

  return (
    <Stack gap={4}>
      <ExpenseTableLayout>
        <Table.Tbody>
          {data.matches.map(e => (
            <ExpenseRow
              key={e.id}
              expense={e}
              userData={userData}
              addFilter={noop}
              onUpdated={noop}
            />
          ))}
        </Table.Tbody>
      </ExpenseTableLayout>
      {truncated ? (
        <Text size="xs" c="neutral.7">
          Näytetään {data.matches.length} viimeisintä kirjausta — yhteensä {data.totalCount} osuu
          tarkasteluikkunaan
        </Text>
      ) : null}
    </Stack>
  );
};

function matchesQueryFor(
  subscription: Subscription,
  range: RecurrenceInterval | undefined,
): SubscriptionMatchesQuery {
  return {
    rowId: subscription.rowId,
    // Non-recurring subscriptions fan out one card per category —
    // narrow matches to that category so the expander only shows rows
    // belonging to *this* card. Recurring cards always span a single
    // category, so passing it is harmless.
    categoryId: subscription.categoryId,
    range,
  };
}
