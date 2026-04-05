import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title as MantineTitle,
} from '@mantine/core';
import React from 'react';
import { useNavigate } from 'react-router';

import { uri } from 'shared/net';
import { readableDateWithYear } from 'shared/time';
import { ExpenseGrouping } from 'shared/types';
import { hasMatchingElements, Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';
import { groupingsPagePath } from 'client/util/Links';

import { Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';
import { GroupedExpenseIcon } from './GroupedExpenseIcon';
import { editExpenseGrouping } from './GroupingEditor';
import { ExpenseGroupingsTagFilters, useFilterTags } from './useFilterTags';

export const ExpenseGroupingsList: React.FC<{
  data: ExpenseGrouping[];
  allTags: string[];
  onReload: () => void;
}> = ({ data, allTags, onReload }) => {
  const filters = useFilterTags();
  const selectedTags = filters.tags ?? [];
  const filtered =
    selectedTags.length < 1 ? data : data.filter(d => hasMatchingElements(d.tags, selectedTags));
  return (
    <>
      <Group justify="flex-end" w="100%">
        <ExpenseGroupingsTagFilters allTags={allTags} {...filters} />
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" w="100%">
        {filtered.map(d => (
          <ExpenseGroupingView grouping={d} key={d.id} onReload={onReload} tags={filters.tags} />
        ))}
      </SimpleGrid>
    </>
  );
};

export const ExpenseGroupingView: React.FC<{
  grouping: ExpenseGrouping;
  tags: string[];
  onReload: () => void;
}> = ({ grouping, onReload }) => {
  const expensesPath = groupingsPagePath + uri`/${grouping.id}`;
  const navigate = useNavigate();
  return (
    <Card w="100%" pos="relative" h={200} bg="neutral.3" shadow="md" radius="md" p={0} m={0}>
      <Group bg="neutral.0" justify="space-between" align="center">
        <Subtitle noBorder order={3} px="sm" fw={700} py={6}>
          {grouping.title}
        </Subtitle>
        <Group gap="xs" px="md">
          <ActionIcon
            size="sm"
            title="Muokkaa seurantaa"
            onClick={() => editExpenseGrouping(grouping.id)}
          >
            <Icons.Edit fontSize="small" />
          </ActionIcon>
          <ActionIcon size="sm" onClick={() => deleteExpenseGrouping(grouping, onReload)}>
            <Icons.Delete fontSize="small" />
          </ActionIcon>
        </Group>
      </Group>
      <Group
        flex={1}
        wrap="nowrap"
        pos="relative"
        onClick={() => navigate(expensesPath)}
        style={{ cursor: 'pointer' }}
      >
        <Box pos="absolute" left={4} top={8} bg="">
          <GroupedExpenseIcon grouping={grouping} size={24} />
        </Box>
        {grouping.image ? (
          <img src={grouping.image} alt="" style={{ width: 168, height: 168 }} />
        ) : null}
        <Stack flex={1} justify="space-between" align="flex-start" h="100%">
          <Stack
            flex={1}
            align="center"
            justify="center"
            style={{ alignSelf: 'stretch' }}
            px="md"
            pt="lg"
            pos="relative"
          >
            {grouping.tags ? (
              <Group
                pos="absolute"
                right="var(--mantine-spacing-xs)"
                top="var(--mantine-spacing-xs)"
                gap="xs"
              >
                {grouping.tags.map(t => (
                  <Badge key={t} size="sm" variant="filled">
                    {t}
                  </Badge>
                ))}
              </Group>
            ) : null}
            <MantineTitle order={1} c="primary.7">
              {Money.from(grouping.totalSum).format()}
            </MantineTitle>
            <GroupingDates grouping={grouping} />
          </Stack>
        </Stack>
      </Group>
    </Card>
  );
};

const GroupingDates: React.FC<{ grouping: ExpenseGrouping }> = ({ grouping }) => {
  if (!grouping.startDate && !grouping.endDate) return null;
  if (!grouping.endDate) {
    return <Text>{readableDateWithYear(grouping.startDate, true)} →</Text>;
  }
  if (!grouping.startDate) {
    return <Text>→ {readableDateWithYear(grouping.endDate, true)}</Text>;
  }
  return (
    <Text>
      {readableDateWithYear(grouping.startDate, true)} -{' '}
      {readableDateWithYear(grouping.endDate, true)}
    </Text>
  );
};

async function deleteExpenseGrouping(grouping: ExpenseGrouping, onReload: () => void) {
  await executeOperation(() => apiConnect.deleteExpenseGrouping(grouping.id), {
    confirm: `Haluatko varmasti poistaa ryhmittelyn '${grouping.title}'?`,
    success: 'Ryhmittely poistettu!',
    postProcess: onReload,
  });
}
