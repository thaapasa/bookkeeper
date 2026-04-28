import { Box, Button, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSuspenseQuery } from '@tanstack/react-query';
import * as React from 'react';
import { z } from 'zod';

import { Subscription, SubscriptionSearchCriteria } from 'shared/expense';
import { Category, ObjectId } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';
import { apiConnect } from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { useCategoryMap } from 'client/data/SessionStore';
import { PageTitle } from 'client/ui/design/PageTitle';

import { QueryBoundary } from '../component/QueryBoundary';
import { useLocalStorageList } from '../hooks/useList.ts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Icons } from '../icons/Icons';
import { PageLayout } from '../layout/PageLayout';
import { SubscriptionCategoryHeader, ToggleCategoryVisibility } from './SubscriptionCategoryHeader';
import { SubscriptionCriteriaSelector } from './SubscriptionCriteriaSelector';
import { SubscriptionEditorDialog } from './SubscriptionEditorDialog';
import { SubscriptionItemView } from './SubscriptionItemView';
import { groupSubscriptions, sumRecurrenceTotals } from './SubscriptionsData';
import { TotalsChart, TotalsData } from './TotalsChart';
import { RecurrenceTotals, SubscriptionGroup } from './types';

export const SubscriptionsPage: React.FC = () => {
  const [criteria, setCriteria] = React.useState<SubscriptionSearchCriteria | undefined>(undefined);
  const [creatorOpen, { open: openCreator, close: closeCreator }] = useDisclosure(false);

  return (
    <PageLayout fullWidth pb="md">
      <PageTitle
        padded
        tools={
          <Button
            variant="filled"
            size="xs"
            leftSection={<Icons.Add size={16} />}
            onClick={openCreator}
            mr={{ base: 'md', sm: 0 }}
          >
            Uusi tilaus
          </Button>
        }
      >
        Tilaukset
      </PageTitle>
      <SubscriptionCriteriaSelector onChange={setCriteria} />
      {criteria !== undefined ? (
        <QueryBoundary>
          <SubscriptionsResults criteria={criteria} />
        </QueryBoundary>
      ) : null}
      <SubscriptionEditorDialog opened={creatorOpen} onClose={closeCreator} />
    </PageLayout>
  );
};

const SubscriptionsResults: React.FC<{ criteria: SubscriptionSearchCriteria }> = ({ criteria }) => {
  const categories = useCategoryMap()!;
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.subscriptions.search(criteria),
    queryFn: () => apiConnect.searchSubscriptions(criteria),
    select: result => groupSubscriptions(result, categories),
  });
  const [catId, setCatId] = React.useState<ObjectId | undefined>(undefined);
  const hidden = useLocalStorageList<number>('subscription.filter.hiddenCategories', []);

  const [perMonth, setPerMonth] = useLocalStorage('subscriptions.show.months', false, z.boolean());
  const filteredGroups = data.groups.filter(g => !hidden.list.includes(g.root.id));
  const pieData = createPieData(filteredGroups, catId, perMonth);
  const selectedIndex = data.groups.findIndex(g => g.root.id === catId);
  const selectedGroup = selectedIndex >= 0 ? data.groups[selectedIndex] : undefined;

  const hasFiltered = filteredGroups.length !== data.groups.length;

  return (
    <>
      <SubscriptionCategoryHeader
        title={hasFiltered ? 'Suodatetut' : 'Kaikki'}
        totals={
          hasFiltered ? sumRecurrenceTotals(filteredGroups.map(g => g.allTotals)) : data.totals
        }
        isRoot
      />
      <Box pos="relative" px={{ base: 'md', sm: 0 }} mb="md">
        <TotalsChart
          data={pieData}
          onSelectCategory={setCatId}
          colorIndex={selectedIndex >= 0 ? selectedIndex : undefined}
        />
        <Box pos="absolute" left="var(--mantine-spacing-md)" top="var(--mantine-spacing-md)">
          <Checkbox
            checked={perMonth}
            onChange={() => setPerMonth(!perMonth)}
            label="Kulut per kk"
          />
        </Box>
      </Box>
      {selectedGroup ? (
        <GroupView
          group={selectedGroup}
          hidden={hidden.list}
          toggleVisibility={hidden.toggleItem}
          range={criteria.range}
        />
      ) : (
        data.groups.map(s => (
          <GroupView
            key={s.root.id}
            group={s}
            hidden={hidden.list}
            toggleVisibility={hidden.toggleItem}
            range={criteria.range}
          />
        ))
      )}
    </>
  );
};

function createPieData(
  groups: SubscriptionGroup[],
  selectedCat: ObjectId | undefined,
  perMonth: boolean,
): TotalsData[] {
  if (!selectedCat) {
    return groups.map(g =>
      total(g.root.name, g.allTotals.recurrencePerYear, g.colorIndex, perMonth, g.root.id),
    );
  }
  const group = groups.find(g => g.root.id === selectedCat);
  if (!group) return [];
  return (
    group.rootTotals
      ? [total(group.root.name, group.rootTotals.recurrencePerYear, group.colorIndex, perMonth)]
      : []
  ).concat(
    group.children.map(c =>
      total(c.category.name, c.totals.recurrencePerYear, group.colorIndex, perMonth),
    ),
  );
}

const total = (
  name: string,
  sum: MoneyLike,
  colorIndex: number,
  perMonth: boolean,
  categoryId?: ObjectId,
): TotalsData => ({
  name,
  sum: Money.from(sum)
    .divide(perMonth ? 12 : 1)
    .valueOf(),
  categoryId,
  colorIndex,
});

const GroupView: React.FC<{
  group: SubscriptionGroup;
  hidden: ObjectId[];
  toggleVisibility: ToggleCategoryVisibility;
  range: SubscriptionSearchCriteria['range'];
}> = ({
  group: { root, rootItems, rootTotals, allTotals, children },
  hidden,
  toggleVisibility,
  range,
}) => {
  const visible = !hidden.includes(root.id);
  return (
    <>
      <SubscriptionCategoryHeader
        title={root.name}
        totals={allTotals}
        isRoot
        categoryId={root.id}
        visible={visible}
        toggleVisibility={toggleVisibility}
      />
      {visible ? (
        <>
          {rootItems ? (
            <CategorySubscriptions
              category={root}
              title="Pääkategorian kirjaukset"
              items={rootItems}
              totals={rootTotals}
              range={range}
            />
          ) : null}
          {children.map(c => (
            <CategorySubscriptions
              key={c.category.id}
              category={c.category}
              items={c.items}
              totals={c.totals}
              range={range}
            />
          ))}
        </>
      ) : null}
    </>
  );
};

const CategorySubscriptions: React.FC<{
  category: Category;
  title?: string;
  items: Subscription[];
  totals?: RecurrenceTotals;
  range: SubscriptionSearchCriteria['range'];
}> = ({ category, items, totals, title, range }) => (
  <>
    <SubscriptionCategoryHeader title={title ?? category.name} totals={totals} />
    {items.map(item => (
      <SubscriptionItemView key={item.id} item={item} range={range} />
    ))}
  </>
);
