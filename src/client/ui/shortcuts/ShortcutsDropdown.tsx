import styled from '@emotion/styled';
import { ActionIcon, Menu } from '@mantine/core';
import * as B from 'baconjs';
import { DateTime } from 'luxon';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { ExpenseShortcut, ExpenseShortcutData, shortcutToExpenseInEditor } from 'shared/expense';
import { uri } from 'shared/net';
import { toDateTime, toISODate, TypedDateRange } from 'shared/time';
import { ObjectId } from 'shared/types';
import { validSessionP } from 'client/data/Login';
import { createExpense, createNewExpense, navigationP } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { primary } from '../Colors';
import { connect } from '../component/BaconConnect';
import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';
import { Icons } from '../icons/Icons';

interface AddExpenseMenuProps {
  shortcuts: ExpenseShortcut[];
  dateRange: TypedDateRange;
}

const AddExpenseMenuImpl: React.FC<AddExpenseMenuProps> = ({ shortcuts, dateRange }) => {
  const navigate = useNavigate();

  const handleAddNew = () => openNewExpenseDialog(navigate, dateRange.start);
  const handleShortcut = (id?: ObjectId, expense?: Partial<ExpenseShortcutData>) => {
    openNewExpenseFromShortcut(navigate, id, expense);
  };

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="filled" color={primary[5]} radius="xl" size="md">
          <Icons.Add color="white" fontSize="small" />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={
            <ShortcutFallback style={{ background: primary[5] }}>
              <Icons.Add color="white" fontSize="small" />
            </ShortcutFallback>
          }
          onClick={handleAddNew}
          fw={600}
        >
          Uusi kirjaus
        </Menu.Item>

        {shortcuts.length > 0 && <Menu.Divider />}

        {shortcuts.map(s => (
          <Menu.Item
            key={s.id}
            leftSection={
              s.icon ? (
                <ShortcutImage src={s.icon} alt={s.title} />
              ) : (
                <ShortcutFallback style={{ background: s.background }}>
                  {s.title.substring(0, 1).toUpperCase()}
                </ShortcutFallback>
              )
            }
            onClick={() => handleShortcut(s.id, s.expense)}
          >
            {s.title}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

const addExpenseMenuP = B.combineTemplate({
  shortcuts: validSessionP.map(s => s.shortcuts || []),
  dateRange: navigationP.map(n => n.dateRange),
});

export const AddExpenseMenu = connect(addExpenseMenuP)(AddExpenseMenuImpl);

function openNewExpenseDialog(navigate: NavigateFunction, shownDay: Date) {
  const path = window.location.pathname;
  const refDay = toDateTime(shownDay);
  const date = refDay.hasSame(DateTime.now(), 'month') ? undefined : refDay;
  if (pageSupportsRoutedExpenseDialog(path)) {
    if (!path.includes(newExpenseSuffix)) {
      const dateSuffix = date ? uri`?date=${toISODate(date)}` : '';
      navigate(
        path.startsWith('/p')
          ? path + newExpenseSuffix + dateSuffix
          : '/p' + newExpenseSuffix + dateSuffix,
      );
    }
  } else {
    createExpense({ date });
  }
}

function openNewExpenseFromShortcut(
  navigate: NavigateFunction,
  id?: ObjectId,
  expense?: Partial<ExpenseShortcutData>,
) {
  const path = window.location.pathname;
  if (pageSupportsRoutedExpenseDialog(path) && id) {
    if (!path.includes(newExpenseSuffix)) {
      const base = path.startsWith('/p') ? path + newExpenseSuffix : '/p' + newExpenseSuffix;
      navigate(base + uri`/${id}`);
    }
    return;
  }
  if (expense) {
    createNewExpense(shortcutToExpenseInEditor(expense));
  }
}

const ShortcutImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: var(--mantine-radius-lg);
`;

const ShortcutFallback = styled.div`
  width: 24px;
  height: 24px;
  border-radius: var(--mantine-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${primary[5]};
  color: white;
  font-size: var(--mantine-font-size-xs);
  font-weight: 600;
`;
