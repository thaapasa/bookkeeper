import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcutData, shortcutToExpenseInEditor } from 'shared/expense';
import { ObjectId } from 'shared/types';
import { createNewExpense } from 'client/data/State';

import { secondaryColors } from '../Colors';

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
  onClick,
  background,
  expense,
  icon,
  title,
  className,
}) => (
  <LinkIconArea
    onClick={
      onClick ?? (expense ? () => createNewExpense(shortcutToExpenseInEditor(expense)) : undefined)
    }
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
