import { IconButton, styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/types';
import { spaced } from 'shared/util';
import { validSessionE } from 'client/data/Login';
import { createNewExpense } from 'client/data/State';

import { secondaryColors } from '../Colors';
import { connect } from '../component/BaconConnect';
import { useToggle } from '../hooks/useToggle';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { ShortcutLink, ShortcutLinkProps } from './ShortcutLink';

const FullList: React.FC<{
  shortcuts: ExpenseShortcut[];
  className?: string;
}> = ({ className, shortcuts }) => {
  const [editMode, toggleEdit] = useToggle(false);
  return (
    <LinksArea className={spaced`${'with-titles'} ${className}`}>
      <ShortcutRow title="Uusi kirjaus" icon={<AddExpenseIcon />}>
        <Flex minWidth="32px" />
        <IconButton onClick={toggleEdit}>
          {editMode ? <Icons.Clear /> : <Icons.EditNote />}
        </IconButton>
      </ShortcutRow>
      {shortcuts.map((l, i) => (
        <ShortcutRow key={`titlelink-${i}`} {...l} expense={l} />
      ))}
      {editMode ? <ShortcutRow title="Lisää linkki" icon={<AddExpenseIcon />} /> : null}
    </LinksArea>
  );
};

const ShortcutRow: React.FC<React.PropsWithChildren<ShortcutLinkProps>> = ({
  expense,
  onClick,
  title,
  children,
  ...props
}) => (
  <TitledRow onClick={onClick ?? (expense ? () => createNewExpense(expense) : undefined)}>
    <ShortcutLink {...props} title={title} />
    <Title>{title}</Title>
    {children}
  </TitledRow>
);

const TitledRow = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  align-self: stretch;
`;

const Title = styled('div')`
  font-size: 14px;
  margin-left: 8px;
  color: ${secondaryColors.dark};
`;

export const ShortcutsView = connect(
  validSessionE.map(s => ({ shortcuts: s.user.expenseShortcuts || [] })),
)(FullList);

const LinksArea = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;

  &.with-titles {
    align-items: flex-start;
  }
`;
