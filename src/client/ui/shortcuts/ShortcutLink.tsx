import { Avatar, type AvatarProps } from '@mantine/core';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { ExpenseShortcutData, shortcutToExpenseInEditor } from 'shared/expense';
import { uri } from 'shared/net';
import { ObjectId } from 'shared/types';
import { createNewExpense } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';

export type ShortcutLinkProps = {
  id?: ObjectId;
  background?: string;
  onClick?: () => void;
  expense?: Partial<ExpenseShortcutData>;
  title: string;
  icon?: string | React.ReactNode;
} & Omit<AvatarProps, 'onClick'>;

export const ShortcutLink: React.FC<ShortcutLinkProps> = ({
  id,
  onClick,
  background,
  expense,
  icon,
  title,
  ...props
}) => {
  const navigate = useNavigate();
  return (
    <Avatar
      radius="xl"
      size={32}
      src={typeof icon === 'string' ? icon : null}
      alt={typeof icon === 'string' ? title : undefined}
      bg={background ?? 'primary.5'}
      c="primary.9"
      fw="bold"
      mt="xs"
      mx={4}
      style={{ cursor: 'pointer' }}
      onClick={onClick ?? (() => openNewExpenseFromShortcutDialog(navigate, id, expense))}
      {...props}
    >
      {typeof icon === 'string' ? null : (icon ?? title.substring(0, 1).toUpperCase())}
    </Avatar>
  );
};

function openNewExpenseFromShortcutDialog(
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
