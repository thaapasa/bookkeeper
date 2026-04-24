import { ActionIcon, Group, Table, Text } from '@mantine/core';
import * as React from 'react';

import {
  ExpenseDivisionItem,
  RecurringExpenseTarget,
  UserExpense,
  UserExpenseWithDetails,
} from 'shared/expense';
import { readableDate, toDateTime } from 'shared/time';
import { Category, CategoryMap, ExpenseGroupingMap, isDefined, Source, User } from 'shared/types';
import { equal, Money, notEqual } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { getFullCategoryName, UserDataProps } from 'client/data/Categories';
import { navigateToExpenseDate, useNavigationStore } from 'client/data/NavigationStore';
import { notifyError } from 'client/data/NotificationStore';
import { invalidateExpenseData, invalidateSubscriptionData } from 'client/data/query';
import { editExpense } from 'client/data/State';
import { logger } from 'client/Logger';
import { forMoney, sumStyleForType } from 'client/ui/ColorUtils';
import { ActivatableTextField } from 'client/ui/component/ActivatableTextField';
import { ExpanderIcon } from 'client/ui/component/ExpanderIcon';
import { UserAvatar } from 'client/ui/component/UserAvatar';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { GroupedExpenseIcon } from 'client/ui/grouping/GroupedExpenseIcon';
import { Icons } from 'client/ui/icons/Icons';
import { classNames } from 'client/ui/utils/classNames';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpenseInfo } from '../details/ExpenseInfo';
import { ReceiverField } from '../dialog/ReceiverField';
import { expenseName } from '../ExpenseHelper';
import { DayParityContext } from './DayParity';
import { AddFilterFn, ExpenseFilters } from './ExpenseFilters';
import styles from './ExpenseRow.module.css';
import { SourceIcon, TextButton } from './ExpenseRowComponents';
import {
  BalanceVisibleFrom,
  CategoryVisibleFrom,
  ReceiverVisibleFrom,
  SourceVisibleFrom,
} from './ExpenseTableColumns';
import { RecurringExpenseIcon, UnconfirmedIcon } from './TableIcons';

const emptyDivision: ExpenseDivisionItem[] = [];

export interface CommonExpenseRowProps {
  expense: UserExpense;
  prev?: UserExpense | null;
  onUpdated: (expense: UserExpense) => void;
  selectCategory?: (category: Category) => void;
  addFilter: AddFilterFn;
}

interface ExpenseRowImplProps extends CommonExpenseRowProps {
  user: User;
  source: Source;
  fullCategoryName: string;
  categoryMap: CategoryMap;
  groupingMap: ExpenseGroupingMap;
  userMap: Record<string, User>;
}

const ExpenseRowImpl: React.FC<ExpenseRowImplProps> = props => {
  const { expense, prev, user, source, categoryMap, groupingMap, userMap, addFilter, onUpdated } =
    props;

  const [details, setDetails] = React.useState<UserExpenseWithDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const dayParities = React.useContext(DayParityContext);

  // Play a one-shot highlight animation when this row is the navigation target.
  // Tracking the seq prevents re-triggering on unrelated re-renders.
  const navTargetId = useNavigationStore(s => s.expenseNavigationTargetId);
  const navSeq = useNavigationStore(s => s.expenseNavigationSeq);
  const [highlight, setHighlight] = React.useState(false);
  const lastHandledSeqRef = React.useRef(0);
  React.useEffect(() => {
    if (navTargetId !== expense.id) return;
    if (lastHandledSeqRef.current === navSeq) return;
    lastHandledSeqRef.current = navSeq;
    setHighlight(true);
    const t = window.setTimeout(() => setHighlight(false), 1600);
    return () => window.clearTimeout(t);
  }, [navTargetId, navSeq, expense.id]);

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
    onUpdated(newData);
  };

  const editDate = async () => {
    const date = await UserPrompts.selectDate('Valitse päivä', expense.date);
    if (!date) return;
    await executeOperation(() => updateExpense({ date }), {
      success: `Muutettu kirjauksen ${expense.title} päiväksi ${readableDate(date)}`,
      postProcess: () => {
        invalidateExpenseData();
        navigateToExpenseDate(date, expense.id);
      },
    });
  };

  const toggleDetails = async () => {
    if (details) {
      setDetails(null);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      try {
        const loaded = await apiConnect.getExpense(expense.id);
        setDetails(loaded);
        setIsLoading(false);
      } catch (error) {
        notifyError('Ei voitu ladata tietoja kirjaukselle', error);
        setDetails(null);
        setIsLoading(false);
      }
    }
  };

  const deleteExpense = async () => {
    const name = expenseName(expense);
    if (expense.recurringExpenseId) {
      return deleteRecurringExpense();
    }
    await executeOperation(() => apiConnect.deleteExpense(expense.id), {
      confirmTitle: 'Poista kirjaus',
      confirm: `Haluatko varmasti poistaa kirjauksen ${name}?`,
      success: `Poistettu kirjaus ${name}`,
      postProcess: () => invalidateExpenseData(),
    });
  };

  const deleteRecurringExpense = async () => {
    const name = expenseName(expense);
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
      postProcess: () => {
        invalidateExpenseData();
        invalidateSubscriptionData();
      },
    });
  };

  const modifyExpense = async () => {
    const e = await apiConnect.getExpense(expense.id);
    // The dialog's own save flow invalidates data and navigates to the saved
    // expense, so we just wait for the user to finish editing.
    await editExpense(e.id);
  };

  const parity = dayParities[expense.id] ?? 0;
  const sumStyle = sumStyleForType(expense.type);

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
        )}
      >
        {/* Date */}
        <Table.Td ta="right" pos="relative" px="xs" onClick={editDate}>
          {expense.recurringExpenseId ? (
            <RecurringExpenseIcon className={styles.recurringIcon} />
          ) : null}
          <Text span visibleFrom="sm" pr="xs" fw="bold">
            {weekDay(expense.date, prev)}
          </Text>
          {readableDate(expense.date)}
        </Table.Td>
        {/* Avatar */}
        <Table.Td>
          <UserAvatar
            user={userMap[expense.userId]}
            size={32}
            onClick={() => addFilter(e => e.userId === expense.userId, user.firstName)}
          />
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
          <ActivatableTextField
            fullWidth
            value={expense.title}
            viewStyle={{ display: 'inline-block', verticalAlign: 'middle' }}
            onChange={v => updateExpense({ title: v })}
          />
        </Table.Td>
        {/* Sum */}
        <Table.Td ta="right" pos="relative" c={sumStyle.c} fw={sumStyle.fw} fs={sumStyle.fs}>
          {sumStyle.prefix}
          {Money.from(expense.sum).format()}
        </Table.Td>
        {/* Receiver */}
        <Table.Td visibleFrom={ReceiverVisibleFrom}>
          <ActivatableTextField
            fullWidth
            value={expense.receiver}
            editorType={ReceiverField}
            onChange={v => updateExpense({ receiver: v })}
          />
        </Table.Td>
        {/* Category */}
        <Table.Td visibleFrom={CategoryVisibleFrom}>
          {fullCategoryLink(expense.categoryId)}
        </Table.Td>
        {/* Source */}
        <Table.Td visibleFrom={SourceVisibleFrom}>
          <SourceIcon
            source={source}
            onClick={() => addFilter(e => e.sourceId === source.id, source.name)}
          />
        </Table.Td>
        {/* Balance */}
        <Table.Td
          ta="right"
          pos="relative"
          visibleFrom={BalanceVisibleFrom}
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
          <Group gap="xs" wrap="nowrap" justify="flex-end">
            <ExpanderIcon
              title="Tiedot"
              open={isDefined(details)}
              onToggle={() => toggleDetails()}
            />
            <ActionIcon title="Muokkaa" onClick={modifyExpense} visibleFrom="sm">
              <Icons.Edit />
            </ActionIcon>
            <ActionIcon title="Poista" onClick={deleteExpense} visibleFrom="sm">
              <Icons.Delete />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
      {isLoading || details ? (
        <ExpenseInfo
          key={'expense-division-' + expense.id}
          loading={isLoading}
          expense={expense}
          onDelete={deleteExpense}
          onModify={modifyExpense}
          division={details ? details.division : emptyDivision}
          source={source}
          fullCategoryName={props.fullCategoryName}
        />
      ) : null}
    </>
  );
};

export const ExpenseRow: React.FC<CommonExpenseRowProps & { userData: UserDataProps }> = props => (
  <ExpenseRowImpl
    {...props}
    categoryMap={props.userData.categoryMap}
    userMap={props.userData.userMap}
    user={props.userData.userMap[props.expense.userId]}
    source={props.userData.sourceMap[props.expense.sourceId]}
    groupingMap={props.userData.groupingMap}
    fullCategoryName={getFullCategoryName(props.expense.categoryId, props.userData.categoryMap)}
  />
);

function weekDay(date: string, prev?: UserExpense | null) {
  const m = toDateTime(date);
  return !prev || !m.hasSame(toDateTime(prev.date), 'day') ? m.toFormat('ccc') : null;
}
