import { Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { readableDate, readableDateWithYear, toDateTime } from 'shared/time';
import { Category, Currency, isDefined, Source } from 'shared/types';
import { equal, Money, notEqual } from 'shared/util';
import { apiConnect } from 'client/data/ApiConnect';
import { getFullCategoryName, UserDataProps } from 'client/data/Categories';
import { navigateToExpenseDate, useNavigationStore } from 'client/data/NavigationStore';
import { invalidateServerData } from 'client/data/query';
import { useExpenseDetails } from 'client/data/useExpenseDetails';
import { logger } from 'client/Logger';
import { forMoney, sumStyleForType } from 'client/ui/ColorUtils';
import { ActivatableTextField } from 'client/ui/component/ActivatableTextField';
import { ExpanderIcon } from 'client/ui/component/ExpanderIcon';
import { QueryBoundary } from 'client/ui/component/QueryBoundary';
import { UserAvatar } from 'client/ui/component/UserAvatar';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { GroupedExpenseIcon } from 'client/ui/grouping/GroupedExpenseIcon';
import { classNames } from 'client/ui/utils/classNames';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpenseInfo } from '../details/ExpenseInfo';
import { ReceiverField } from '../dialog/ReceiverField';
import { DayParityContext } from './DayParity';
import { AddFilterFn, ExpenseFilters } from './ExpenseFilters';
import styles from './ExpenseRow.module.css';
import { SourceIcon, TextButton } from './ExpenseRowComponents';
import { ExpenseRowMenu } from './ExpenseRowMenu';
import {
  ActionsVisibleFrom,
  AllColumns,
  BalanceVisibleFrom,
  CategoryVisibleFrom,
  ReceiverVisibleFrom,
  SourceVisibleFrom,
} from './ExpenseTableColumns';
import { LoadingIndicator } from './SpecialRows';
import { RecurringExpenseIcon, SplitLinkIcon, UnconfirmedIcon } from './TableIcons';

export interface CommonExpenseRowProps {
  expense: UserExpense;
  prev?: UserExpense | null;
  /**
   * Optional hook for patching the edited expense into the parent's cache
   * immediately (e.g. the month view's optimistic patch). Consistency does not
   * depend on it: inline edits invalidate all queries themselves.
   */
  onUpdated?: (expense: UserExpense) => void;
  selectCategory?: (category: Category) => void;
  addFilter: AddFilterFn;
  /**
   * When false, the row renders read-only: title/receiver are plain
   * text, the date isn't clickable, and the per-row expander/Edit/Delete
   * actions are hidden. Defaults to true. Used by the subscription
   * preview/matches lists.
   */
  editable?: boolean;
}

export const ExpenseRow: React.FC<CommonExpenseRowProps & { userData: UserDataProps }> = props => {
  const { expense, prev, userData, addFilter, onUpdated, editable = true } = props;
  const { categoryMap, userMap, sourceMap, groupingMap, currencyMap } = userData;
  const user = userMap[expense.userId];
  const source = sourceMap[expense.sourceId];
  const fullCategoryName = getFullCategoryName(expense.categoryId, categoryMap);

  const [showDetails, setShowDetails] = React.useState(false);
  const dayParities = React.useContext(DayParityContext);

  // Play a one-shot highlight animation when this row is the navigation target.
  // The store tracks the highest seq that's already played so re-mounts (e.g.
  // after navigating away and back) don't replay the same animation. Marking the
  // seq consumed is what ends the animation, so it happens once the timer fires.
  const navTargetId = useNavigationStore(s => s.expenseNavigationTargetId);
  const navSeq = useNavigationStore(s => s.expenseNavigationSeq);
  const consumedSeq = useNavigationStore(s => s.expenseHighlightConsumedSeq);
  const highlight = navTargetId === expense.id && navSeq > consumedSeq;
  React.useEffect(() => {
    if (!highlight) return;
    const t = window.setTimeout(
      () => useNavigationStore.getState().consumeExpenseHighlight(navSeq),
      1600,
    );
    return () => window.clearTimeout(t);
  }, [highlight, navSeq]);

  const onClickCategory = (cat: Category) => {
    props.selectCategory?.(cat);
    addFilter(
      e => e.categoryId === cat.id || categoryMap[e.categoryId].parentId === cat.id,
      getFullCategoryName(cat.id, categoryMap),
    );
  };

  const categoryLink = (id: number) => {
    const cat = categoryMap[id];
    return (
      <TextButton key={cat.id} onClick={() => onClickCategory(cat)} c="primary.7">
        {cat.name}
      </TextButton>
    );
  };

  const fullCategoryLink = (id: number) => {
    const cat = categoryMap[id];
    return cat.parentId ? [categoryLink(cat.parentId), ' - ', categoryLink(id)] : categoryLink(id);
  };

  const updateExpense = async (data: Partial<UserExpense>) => {
    logger.info(data, 'Updating expense with data');
    const exp = await apiConnect.getExpense(expense.id);
    const newData: UserExpense = { ...exp, ...data };
    await apiConnect.updateExpense(expense.id, newData);
    onUpdated?.(newData);
    invalidateServerData();
  };

  const editDate = async () => {
    const date = await UserPrompts.selectDate('Valitse päivä', expense.date);
    if (!date) return;
    await executeOperation(() => updateExpense({ date }), {
      success: `Muutettu kirjauksen ${expense.title} päiväksi ${readableDate(date)}`,
      postProcess: () => navigateToExpenseDate(date, expense.id),
    });
  };

  const parity = dayParities[expense.id] ?? 0;
  // Continuation row of a split group: rendered right below another expense of
  // the same group (the table orders group members adjacent within a day), so
  // the repeated date/avatar are dropped to read as one block; the date slot
  // shows a dim link marker instead.
  const continuesSplit =
    !!expense.splitId && prev?.date === expense.date && prev?.splitId === expense.splitId;
  const sumStyle = sumStyleForType(expense.type);
  const currency = expense.currencyId ? currencyMap[expense.currencyId] : undefined;

  const grouping = groupingMap[expense?.groupingId ?? 0];
  const autoGroupings = (expense?.autoGroupingIds ?? []).map(g => groupingMap[g]).filter(isDefined);

  return (
    <>
      <Table.Tr
        data-expense-id={expense.id}
        data-expense-date={expense.date}
        className={classNames(
          parity === 1 ? styles.alternateRow : null,
          highlight ? styles.highlightRow : null,
          continuesSplit ? styles.splitContinuation : null,
        )}
      >
        {/* Date */}
        <Table.Td
          ta="right"
          pos="relative"
          onClick={editable && !continuesSplit ? editDate : undefined}
        >
          {/* An expense is never both subscription-generated and split-linked
              (enforced server-side); the !continuesSplit check is defence in depth
              so the split marker wins the date slot if that invariant ever breaks. */}
          {expense.subscriptionId && !continuesSplit ? (
            <RecurringExpenseIcon className={styles.recurringIcon} />
          ) : null}
          {continuesSplit ? (
            <SplitLinkIcon />
          ) : (
            <Tooltip label={readableDateWithYear(expense.date, true)}>
              <Text span inherit>
                <Text span className={ActionsVisibleFrom} pr="xs" fw="bold">
                  {weekDay(expense.date, prev)}
                </Text>
                {readableDate(expense.date)}
              </Text>
            </Tooltip>
          )}
        </Table.Td>
        {/* Avatar */}
        <Table.Td>
          {continuesSplit && prev?.userId === expense.userId ? null : (
            <Tooltip label={userMap[expense.userId].firstName}>
              <UserAvatar
                user={userMap[expense.userId]}
                size={32}
                onClick={() => addFilter(e => e.userId === expense.userId, user.firstName)}
              />
            </Tooltip>
          )}
        </Table.Td>
        {/* Name */}
        <Table.Td pos="relative">
          <Group pos="absolute" gap="xs" top={0} right={0}>
            {expense.confirmed ? null : (
              <UnconfirmedIcon onClick={() => addFilter(ExpenseFilters.unconfirmed, 'Alustavat')} />
            )}
            {grouping ? (
              <GroupedExpenseIcon
                grouping={grouping}
                onClick={() => addFilter(e => e.groupingId === grouping.id, grouping.title)}
              />
            ) : autoGroupings ? (
              autoGroupings.map(a => (
                <GroupedExpenseIcon
                  key={a.id}
                  grouping={a}
                  onClick={() => addFilter(e => e.groupingId === a.id, a.title)}
                />
              ))
            ) : null}
          </Group>
          {editable ? (
            <ActivatableTextField
              fullWidth
              value={expense.title}
              viewStyle={{ display: 'inline-block', verticalAlign: 'middle' }}
              onChange={v => updateExpense({ title: v })}
            />
          ) : (
            <Text span>{expense.title}</Text>
          )}
        </Table.Td>
        {/* Sum */}
        <Table.Td ta="right" pos="relative" c={sumStyle.c} fw={sumStyle.fw} fs={sumStyle.fs}>
          <SumCell expense={expense} prefix={sumStyle.prefix} currency={currency} />
        </Table.Td>
        {/* Source */}
        <Table.Td className={SourceVisibleFrom}>
          <SourceIcon
            source={source}
            onClick={() => addFilter(e => e.sourceId === source.id, source.name)}
          />
        </Table.Td>
        {/* Receiver */}
        <Table.Td className={ReceiverVisibleFrom}>
          {continuesSplit && prev?.receiver === expense.receiver ? null : editable ? (
            <ActivatableTextField
              fullWidth
              value={expense.receiver}
              editorType={ReceiverField}
              onChange={v => updateExpense({ receiver: v })}
            />
          ) : (
            <Text span>{expense.receiver}</Text>
          )}
        </Table.Td>
        {/* Category */}
        <Table.Td className={CategoryVisibleFrom}>{fullCategoryLink(expense.categoryId)}</Table.Td>
        {/* Balance */}
        <Table.Td
          ta="right"
          pos="relative"
          className={BalanceVisibleFrom}
          c={forMoney(expense.userBalance)}
          onClick={() =>
            Money.zero.equals(expense.userBalance)
              ? addFilter(ExpenseFilters.zeroBalance, `Balanssi ${equal} 0`)
              : addFilter(ExpenseFilters.nonZeroBalance, `Balanssi ${notEqual} 0`)
          }
        >
          {Money.from(expense.userBalance).format()}
        </Table.Td>
        {/* Tools */}
        <Table.Td ta="right">
          {editable ? (
            <Group gap={2} wrap="nowrap" justify="flex-end">
              <ExpanderIcon
                title="Tiedot"
                open={showDetails}
                onToggle={() => setShowDetails(d => !d)}
              />
              <ExpenseRowMenu expense={expense} />
            </Group>
          ) : null}
        </Table.Td>
      </Table.Tr>
      {editable && showDetails ? (
        <QueryBoundary fallback={<LoadingIndicator forRow />} errorFallback={<DetailsLoadError />}>
          <ExpenseRowDetails
            expense={expense}
            source={source}
            fullCategoryName={fullCategoryName}
          />
        </QueryBoundary>
      ) : null}
    </>
  );
};

/** Expanded details row: suspends while the expense details load. */
const ExpenseRowDetails: React.FC<{
  expense: UserExpense;
  source: Source;
  fullCategoryName: string;
}> = ({ expense, source, fullCategoryName }) => {
  const details = useExpenseDetails(expense.id);
  return (
    <ExpenseInfo
      expense={expense}
      division={details.division}
      matchedStatementRows={details.matchedStatementRows}
      source={source}
      fullCategoryName={fullCategoryName}
    />
  );
};

const DetailsLoadError: React.FC = () => (
  <Table.Tr>
    <AllColumns>
      <Text c="red" px="md" py="xs">
        Ei voitu ladata tietoja kirjaukselle
      </Text>
    </AllColumns>
  </Table.Tr>
);

/**
 * The sum column normally holds a single EUR value. When the expense also records what it
 * cost in a foreign currency, the original amount is stacked above the EUR sum, tightly
 * enough that the pair still reads as one row.
 *
 * The EUR sum consequently sits a little below the baseline of the single-line sums in the
 * rows around it. That is a deliberate trade: lifting only the original out of the cell's
 * padding preserved the baseline, but left too little room to render the foreign amount
 * legibly.
 *
 * Dimmed rather than recolored, so income and transfer rows keep their type color.
 */
const SumCell: React.FC<{
  expense: UserExpense;
  prefix: string;
  currency?: Currency;
}> = ({ expense, prefix, currency }) => {
  const eurSum = `${prefix}${Money.from(expense.sum).format()}`;
  if (!currency || expense.originalCurrencyValue == null) {
    return <>{eurSum}</>;
  }
  const originalSum = Money.from(expense.originalCurrencyValue).format(2, {
    currency: currency.code,
  });
  return (
    <Stack gap={0}>
      <Text span size="xs" opacity={0.6} lh={1.2}>
        {prefix}
        {originalSum}
      </Text>
      {eurSum}
    </Stack>
  );
};

function weekDay(date: string, prev?: UserExpense | null) {
  const m = toDateTime(date);
  return !prev || !m.hasSame(toDateTime(prev.date), 'day') ? m.toFormat('ccc') : null;
}
