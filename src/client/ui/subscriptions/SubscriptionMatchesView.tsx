import { Anchor, Box, Group, Stack, Text } from '@mantine/core';
import { useSuspenseQuery } from '@tanstack/react-query';
import * as React from 'react';

import { Subscription, SubscriptionMatchesQuery } from 'shared/expense';
import { readableDateWithYear } from 'shared/time';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { editExpense } from 'client/data/State';

const matchLimit = 20;

export const SubscriptionMatchesView: React.FC<{ subscription: Subscription }> = ({
  subscription,
}) => {
  const query = matchesQueryFor(subscription);
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.subscriptions.matches(query),
    queryFn: () => apiConnect.getSubscriptionMatches(query),
  });

  if (data.totalCount === 0) {
    return (
      <Box px="md" py="xs" c="neutral.7">
        <Text size="sm">Ei kirjauksia tarkasteluikkunassa.</Text>
      </Box>
    );
  }

  const truncated = data.totalCount > data.matches.length;

  return (
    <Stack gap={2} px="md" py="xs">
      <Group gap="xs" justify="space-between">
        <Text size="sm" c="neutral.7">
          {data.totalCount} kirjausta · yhteensä {Money.from(data.totalSum).format()}
        </Text>
      </Group>
      {data.matches.map(m => (
        <Group key={m.id} gap="xs" wrap="nowrap" align="center">
          <Box w={120} ta="left">
            <Text size="sm">{readableDateWithYear(m.date)}</Text>
          </Box>
          <Box flex={1}>
            <Anchor
              component="button"
              size="sm"
              ta="left"
              onClick={() => editExpense(m.id)}
              style={{ textAlign: 'left' }}
            >
              {m.title}
              {m.receiver ? ` · ${m.receiver}` : ''}
            </Anchor>
          </Box>
          <Box w={104} ta="right">
            <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Money.from(m.sum).format()}
            </Text>
          </Box>
        </Group>
      ))}
      {truncated ? (
        <Text size="xs" c="neutral.7" mt={4}>
          Näytetään {data.matches.length} viimeisintä kirjausta
        </Text>
      ) : null}
    </Stack>
  );
};

function matchesQueryFor(subscription: Subscription): SubscriptionMatchesQuery {
  return {
    rowId: subscription.rowId,
    // Non-recurring subscriptions fan out one card per category —
    // narrow matches to that category so the expander only shows rows
    // belonging to *this* card. Recurring cards always span a single
    // category, so passing
    // it is harmless.
    categoryId: subscription.categoryId,
    limit: matchLimit,
  };
}
