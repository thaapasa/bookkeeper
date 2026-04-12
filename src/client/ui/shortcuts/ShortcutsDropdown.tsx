import { ActionIcon, Avatar, Box, Menu, ThemeIcon } from '@mantine/core';
import { DateTime } from 'luxon';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { ExpenseShortcutData, shortcutToExpenseInEditor } from 'shared/expense';
import { uri } from 'shared/net';
import { ISODate, toDateTime } from 'shared/time';
import { ObjectId } from 'shared/types';
import { useNavigationStore } from 'client/data/NavigationStore';
import { useValidSession } from 'client/data/SessionStore';
import { createExpense, createNewExpense } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';
import { Icons } from '../icons/Icons';

export const AddExpenseMenu: React.FC = () => {
  const session = useValidSession();
  const dateRange = useNavigationStore(s => s.dateRange);
  const shortcuts = session.shortcuts || [];
  const navigate = useNavigate();

  const handleAddNew = () => openNewExpenseDialog(navigate, dateRange.start);
  const handleShortcut = (id?: ObjectId, expense?: Partial<ExpenseShortcutData>) => {
    openNewExpenseFromShortcut(navigate, dateRange.start, id, expense);
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
            <ThemeIcon radius="lg" size={24} color="primary.5">
              <Icons.Add color="white" fontSize="small" />
            </ThemeIcon>
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

function openNewExpenseDialog(navigate: NavigateFunction, shownDay: ISODate) {
  const path = window.location.pathname;
  const refDay = toDateTime(shownDay);
  const date = refDay.hasSame(DateTime.now(), 'month') ? undefined : shownDay;
  if (pageSupportsRoutedExpenseDialog(path)) {
    if (!path.includes(newExpenseSuffix)) {
      const dateSuffix = date ? uri`?date=${date}` : '';
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
  shownDay: ISODate,
  id?: ObjectId,
  expense?: Partial<ExpenseShortcutData>,
) {
  const path = window.location.pathname;
  const refDay = toDateTime(shownDay);
  const date = refDay.hasSame(DateTime.now(), 'month') ? undefined : shownDay;
  if (pageSupportsRoutedExpenseDialog(path) && id) {
    if (!path.includes(newExpenseSuffix)) {
      const dateSuffix = date ? uri`?date=${date}` : '';
      const base = path.startsWith('/p') ? path + newExpenseSuffix : '/p' + newExpenseSuffix;
      navigate(base + uri`/${id}` + dateSuffix);
    }
    return;
  }
  if (expense) {
    const values = shortcutToExpenseInEditor(expense);
    if (date) {
      values.date = date;
    }
    createNewExpense(values);
  }
}
