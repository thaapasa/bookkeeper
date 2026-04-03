import { ActionIcon, Avatar, Box, Menu } from '@mantine/core';
import * as B from 'baconjs';
import { DateTime } from 'luxon';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { ExpenseShortcutData, shortcutToExpenseInEditor } from 'shared/expense';
import { uri } from 'shared/net';
import { toDateTime, toISODate } from 'shared/time';
import { ObjectId } from 'shared/types';
import { validSessionP } from 'client/data/Login';
import { createExpense, createNewExpense, navigationP } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';
import { useBaconProperty } from '../hooks/useBaconState';
import { Icons } from '../icons/Icons';

const addExpenseMenuP = B.combineTemplate({
  shortcuts: validSessionP.map(s => s.shortcuts || []),
  dateRange: navigationP.map(n => n.dateRange),
});

export const AddExpenseMenu: React.FC = () => {
  const { shortcuts, dateRange } = useBaconProperty(addExpenseMenuP);
  const navigate = useNavigate();

  const handleAddNew = () => openNewExpenseDialog(navigate, dateRange.start);
  const handleShortcut = (id?: ObjectId, expense?: Partial<ExpenseShortcutData>) => {
    openNewExpenseFromShortcut(navigate, id, expense);
  };

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="filled" color="primary.5" radius="xl" size="md">
          <Icons.Add color="white" fontSize="small" />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={
            <Avatar radius="lg" size={24} bg="primary.5" c="white">
              <Icons.Add color="white" fontSize="small" />
            </Avatar>
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
                <Box
                  component="img"
                  src={s.icon}
                  alt={s.title}
                  w={24}
                  h={24}
                  style={{ borderRadius: 'var(--mantine-radius-lg)' }}
                />
              ) : (
                <Avatar radius="lg" size={24} bg={s.background} c="white" fw={600} fz="xs">
                  {s.title.substring(0, 1).toUpperCase()}
                </Avatar>
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
