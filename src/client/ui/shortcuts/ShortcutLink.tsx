import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseInEditor } from 'shared/expense';
import { createNewExpense } from 'client/data/State';

import { secondaryColors } from '../Colors';

export interface ShortcutLinkProps {
  background?: string;
  onClick?: () => void;
  expense?: Partial<ExpenseInEditor>;
  title: string;
  icon?: string | React.ReactNode;
}

export const ShortcutLink: React.FC<ShortcutLinkProps> = ({
  onClick,
  background,
  expense,
  icon,
  title,
}) => (
  <LinkIconArea
    onClick={onClick ?? (expense ? () => createNewExpense(expense) : undefined)}
    style={{ background }}
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
  width: 34px;
  height: 34px;
  margin: 0 4px;
  background-color: ${secondaryColors.standard};
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  margin-bottom: 4px;
  text-decoration: none;
  color: ${secondaryColors.text};
  font-weight: bold;
  cursor: pointer;
`;
