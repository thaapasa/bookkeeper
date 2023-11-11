import { styled } from '@mui/material';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { ExpenseShortcutData, shortcutToExpenseInEditor } from 'shared/expense';
import { uri } from 'shared/net';
import { ObjectId } from 'shared/types';
import { createNewExpense } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { secondaryColors } from '../Colors';
import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';

export interface ShortcutLinkProps {
  id?: ObjectId;
  background?: string;
  onClick?: () => void;
  expense?: Partial<ExpenseShortcutData>;
  title: string;
  icon?: string | React.ReactNode;
  className?: string;
}

export const ShortcutLink: React.FC<ShortcutLinkProps> = ({
  id,
  onClick,
  background,
  expense,
  icon,
  title,
  className,
}) => {
  const navigate = useNavigate();
  return (
    <LinkIconArea
      onClick={onClick ?? (() => openNewExpenseFromShortcutDialog(navigate, id, expense))}
      style={{ background }}
      className={className}
    >
      {typeof icon === 'string' ? (
        <LinkImage src={icon} title={title} />
      ) : (
        icon ?? title.substring(0, 1).toUpperCase()
      )}
    </LinkIconArea>
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

const LinkImage = styled('img')`
  width: 32px;
  height: 32px;
  border-radius: 16px;
`;

const LinkIconArea = styled('div')`
  width: 32px;
  height: 32px;
  margin: 8px 4px 4px 4px;
  background-color: ${secondaryColors.standard};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: ${secondaryColors.text};
  font-weight: bold;
  cursor: pointer;
`;
