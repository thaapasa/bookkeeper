import { IconButton, styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/types';
import { noop, spaced } from 'shared/util';
import { validSessionE } from 'client/data/Login';
import { createNewExpense } from 'client/data/State';

import { secondaryColors } from '../Colors';
import { connect } from '../component/BaconConnect';
import { Row } from '../component/Row';
import { useToggle } from '../hooks/useToggle';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { editShortcut, ShortcutDialog } from './ShortcutDialog';
import { ShortcutLink, ShortcutLinkProps } from './ShortcutLink';

const FullList: React.FC<{
  shortcuts: ExpenseShortcut[];
  className?: string;
}> = ({ className, shortcuts }) => {
  const [editMode, toggleEdit] = useToggle(false);
  return (
    <>
      <LinksArea className={spaced`${'with-titles'} ${className}`}>
        <ShortcutRow
          title="Uusi kirjaus"
          icon={<AddExpenseIcon />}
          onClick={() => createNewExpense({})}
        >
          <Flex minWidth="32px" />
          <IconButton onClick={toggleEdit}>
            {editMode ? <Icons.Clear /> : <Icons.EditNote />}
          </IconButton>
        </ShortcutRow>
        {shortcuts.map(l => (
          <ShortcutRow
            key={`titlelink-${l.id}`}
            {...l}
            onEdit={editMode ? () => editShortcut(l.id) : undefined}
          />
        ))}
        {editMode ? (
          <ShortcutRow title="Lisää linkki" icon={<AddExpenseIcon />} onClick={noop} />
        ) : null}
      </LinksArea>
      <ShortcutDialog />
    </>
  );
};

const ShortcutRow: React.FC<
  React.PropsWithChildren<ShortcutLinkProps & { onEdit?: () => void }>
> = ({ expense, onClick, onEdit, title, children, ...props }) => (
  <TitledRow>
    <Row
      onClick={onClick ?? (expense ? () => createNewExpense(expense) : undefined)}
      className={onClick || expense ? 'clickable' : undefined}
    >
      <ShortcutLink {...props} title={title} />
      <Title>{title}</Title>
    </Row>
    {children}
    {onEdit ? (
      <>
        <Flex minWidth="32px" />
        <IconButton size="small" onClick={onEdit}>
          <Icons.Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onEdit} style={{ marginRight: '4px' }}>
          <Icons.Delete fontSize="small" color="warning" />
        </IconButton>
      </>
    ) : null}
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

export const ShortcutsView = connect(validSessionE.map(s => ({ shortcuts: s.shortcuts || [] })))(
  FullList,
);

const LinksArea = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;

  &.with-titles {
    align-items: flex-start;
  }
`;
