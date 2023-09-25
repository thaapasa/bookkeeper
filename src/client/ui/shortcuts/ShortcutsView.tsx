import { IconButton, styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut, ObjectId } from 'shared/types';
import { noop, spaced } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateSession, validSessionE } from 'client/data/Login';
import { createNewExpense } from 'client/data/State';
import { executeOperation } from 'client/util/ExecuteOperation';

import { secondaryColors } from '../Colors';
import { connect } from '../component/BaconConnect';
import { Row } from '../component/Row';
import { useToggle } from '../hooks/useToggle';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { editShortcut, ShortcutEditor } from './ShortcutEditor';
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
            onDelete={editMode ? () => deleteShortcut(l.id) : undefined}
          />
        ))}
        {editMode ? (
          <ShortcutRow title="Lisää linkki" icon={<AddExpenseIcon />} onClick={noop} />
        ) : null}
      </LinksArea>
      <ShortcutEditor />
    </>
  );
};

const ShortcutRow: React.FC<
  React.PropsWithChildren<ShortcutLinkProps & { onEdit?: () => void; onDelete?: () => void }>
> = ({ expense, onClick, onEdit, onDelete, title, children, ...props }) => (
  <TitledRow>
    <Row
      onClick={onClick ?? (expense ? () => createNewExpense(expense) : undefined)}
      className={onClick || expense ? 'clickable' : undefined}
    >
      <ShortcutLink {...props} title={title} />
      <Title>{title}</Title>
    </Row>
    {children}
    {onEdit || onDelete ? (
      <>
        <Flex minWidth="32px" />
        {onEdit ? (
          <IconButton size="small" onClick={onEdit}>
            <Icons.Edit fontSize="small" />
          </IconButton>
        ) : null}
        {onDelete ? (
          <IconButton size="small" onClick={onDelete} style={{ marginRight: '4px' }}>
            <Icons.Delete fontSize="small" color="warning" />
          </IconButton>
        ) : null}
      </>
    ) : null}
  </TitledRow>
);

function deleteShortcut(shortcutId: ObjectId) {
  return executeOperation(() => apiConnect.deleteShortcut(shortcutId), {
    postProcess: updateSession,
    success: 'Linkki poistettu!',
  });
}

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
