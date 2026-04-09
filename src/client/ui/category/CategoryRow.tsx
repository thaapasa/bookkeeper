import { Group, Table } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { UIDateRange } from 'shared/time';
import { Category, CategoryAndTotals, ObjectId } from 'shared/types';
import { Money, MoneyLike, noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { UserDataProps } from 'client/data/Categories';
import { needUpdateE } from 'client/data/State';

import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { useDeferredData } from '../hooks/useAsyncData';
import { AllColumns } from './CategoryTableLayout';
import { AddCategoryButton, EditCategoryButton, ToggleButton } from './CategoryTools';

interface CategoryRowProps {
  category: Category;
  header: boolean;
  title?: string;
  createCategory: (p?: Category) => void;
  editCategory: (p: Category) => void;
  categoryTotals: Record<string, CategoryAndTotals>;
  range: UIDateRange;
  userData: UserDataProps;
}

function formatMoney(m?: MoneyLike): string {
  return m ? Money.from(m).format() : '-';
}

function isUnimportant(m?: MoneyLike): boolean {
  if (!m) return true;
  const b = Money.from(m);
  return b.equals(0);
}

export const CategoryRow: React.FC<CategoryRowProps> = props => {
  const { category, header, categoryTotals, title, createCategory, editCategory } = props;
  const [open, { toggle: toggleOpen }] = useDisclosure();

  const totals = categoryTotals['' + category.id];
  const income = totals ? (header ? totals.totalIncome : totals.income) : Money.zero;
  const expense = totals ? (header ? totals.totalExpenses : totals.expenses) : Money.zero;

  return (
    <>
      <Table.Tr bg={header ? 'neutral.4' : 'neutral.2'}>
        <Table.Td pl="md" fw={header ? 700 : undefined} c={!header ? 'primary.7' : undefined}>
          {title || category.name}
        </Table.Td>
        <Table.Td
          ta="right"
          w={75}
          style={{ whiteSpace: 'nowrap' }}
          c={isUnimportant(income) ? 'dimmed' : undefined}
          opacity={isUnimportant(income) ? 0.5 : undefined}
        >
          {formatMoney(income)}
        </Table.Td>
        <Table.Td
          ta="right"
          w={75}
          style={{ whiteSpace: 'nowrap' }}
          c={isUnimportant(expense) ? 'dimmed' : undefined}
          opacity={isUnimportant(expense) ? 0.5 : undefined}
        >
          {formatMoney(expense)}
        </Table.Td>
        <Table.Td w={70}>
          {header ? (
            <Group gap={2} justify="flex-end" wrap="nowrap">
              <AddCategoryButton parent={category} color="neutral.7" onAdd={createCategory} />
            </Group>
          ) : (
            <Group gap={2} justify="flex-end" wrap="nowrap">
              <EditCategoryButton category={category} color="primary.5" onEdit={editCategory} />
              <ToggleButton color="primary.5" onToggle={toggleOpen} state={open} />
            </Group>
          )}
        </Table.Td>
      </Table.Tr>
      {open ? (
        <Table.Tr>
          <AllColumns px="md">
            <CategoryRowExpenses {...props} />
          </AllColumns>
        </Table.Tr>
      ) : null}
    </>
  );
};

const CategoryRowExpenses: React.FC<{
  range: UIDateRange;
  category: Category;
  userData: UserDataProps;
}> = ({ range, category, userData }) => {
  const { data, loadData } = useDeferredData(searchExpenses, true, range, category.id);
  React.useEffect(loadData, [loadData]);
  React.useEffect(() => needUpdateE.onValue(loadData), [loadData]);

  if (data.type !== 'loaded') {
    return <>Ladataan...</>;
  }
  if (!data.value || data.value.length < 1) {
    return <>Ei kirjauksia</>;
  }
  return (
    <ExpenseTableLayout padded>
      <Table.Tbody>
        {data.value.map(expense => (
          <ExpenseRow
            expense={expense}
            userData={userData}
            key={'expense-row-' + expense.id}
            addFilter={noop}
            onUpdated={loadData}
          />
        ))}
      </Table.Tbody>
    </ExpenseTableLayout>
  );
};

function searchExpenses(range: UIDateRange, categoryId: ObjectId) {
  return apiConnect.searchExpenses({
    startDate: range.start,
    endDate: range.end,
    categoryId,
    includeSubCategories: false,
  });
}
