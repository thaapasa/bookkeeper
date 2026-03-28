import { ActionIcon, Group, Table, Text } from '@mantine/core';
import * as React from 'react';

import {
  ExpenseDivisionItem,
  RecurringExpenseTarget,
  UserExpense,
  UserExpenseWithDetails,
} from 'shared/expense';
import { readableDate, toDate, toDateTime, toISODate } from 'shared/time';
import { Category, CategoryMap, ExpenseGroupingMap, isDefined, Source, User } from 'shared/types';
import { equal, Money, notEqual } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { getFullCategoryName, UserDataProps } from 'client/data/Categories';
import { editExpense, needUpdateE, notifyError, updateExpenses } from 'client/data/State';
import { logger } from 'client/Logger';
import { action, primary } from 'client/ui/Colors';
import { forMoney } from 'client/ui/ColorUtils';
import { ActivatableTextField } from 'client/ui/component/ActivatableTextField';
import { ExpanderIcon } from 'client/ui/component/ExpanderIcon';
import { UserAvatar } from 'client/ui/component/UserAvatar';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { GroupedExpenseIcon } from 'client/ui/grouping/GroupedExpenseIcon';
import { ExpenseTypeIcon } from 'client/ui/icons/ExpenseType';
import { Icons } from 'client/ui/icons/Icons.tsx';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpenseInfo } from '../details/ExpenseInfo';
import { ReceiverField } from '../dialog/ReceiverField';
import { expenseName } from '../ExpenseHelper';
import {
  BalanceVisibleFrom,
  CategoryVisibleFrom,
  ReceiverVisibleFrom,
  SourceVisibleFrom,
} from './Breakpoints';
import { DayParityContext } from './DayParity';
import { AddFilterFn, ExpenseFilters } from './ExpenseFilters';
import { SourceIcon, TextButton } from './ExpenseRowComponents';
import { IconToolArea, RecurringExpenseIcon, UnconfirmedIcon } from './TableIcons';

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
      <TextButton key={cat.id} onClick={() => onClickCategory(cat)} style={{ color: action }}>
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
    const date = await UserPrompts.selectDate('Valitse päivä', toDateTime(expense.date));
    if (!date) return;
    await executeOperation(() => updateExpense({ date: toISODate(date) }), {
      success: `Muutettu kirjauksen ${expense.title} päiväksi ${readableDate(date)}`,
      postProcess: () => needUpdateE.push(date),
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
      postProcess: () => updateExpenses(toDate(expense.date)),
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
      postProcess: () => updateExpenses(toDate(expense.date)),
    });
  };

  const modifyExpense = async () => {
    const e = await apiConnect.getExpense(expense.id);
    const modified = await editExpense(e.id);
    if (modified) {
      updateExpenses(toDate(modified.date));
    }
  };

  const parity = dayParities[expense.id] ?? 0;

  const grouping = groupingMap[expense?.groupingId ?? 0];
  const autoGroupings = (expense?.autoGroupingIds ?? []).map(g => groupingMap[g]).filter(isDefined);

  return (
    <>
      <Table.Tr bg={parity === 1 ? 'neutral.1' : undefined}>
        {/* Date */}
        <Table.Td ta="right" pos="relative" px="xs" onClick={editDate}>
          {expense.recurringExpenseId ? <RecurringExpenseIcon /> : null}
          <Text span visibleFrom="sm" pr={6} fw="bold">
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
          <IconToolArea>
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
          </IconToolArea>
          <ActivatableTextField
            fullWidth
            value={expense.title}
            viewStyle={{ display: 'inline-block', verticalAlign: 'middle' }}
            onChange={v => updateExpense({ title: v })}
          />
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
        {/* Sum */}
        <Table.Td ta="right" pos="relative">
          <Group justify="space-between" wrap="nowrap" gap={4}>
            <ExpenseTypeIcon type={expense.type} color={primary[7]} size={20} />
            {Money.from(expense.sum).format()}
          </Group>
        </Table.Td>
        {/* Balance */}
        <Table.Td
          ta="right"
          pos="relative"
          visibleFrom={BalanceVisibleFrom}
          style={{ color: forMoney(expense.userBalance) }}
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
          user={user}
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
