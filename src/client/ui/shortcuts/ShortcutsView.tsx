import { IconButton, styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcut, ExpenseShortcutPayload, shortcutToExpenseInEditor } from 'shared/expense';
import { ObjectId } from 'shared/types';
import { noop, spaced } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateSession, validSessionE } from 'client/data/Login';
import { createNewExpense, requestNewExpense } from 'client/data/State';
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
          icon={<AddExpenseIcon onClick={noop} />}
          onClick={() => createNewExpense({})}
        >
          <Flex minWidth="32px" />
          <IconButton onClick={toggleEdit}>
            {editMode ? <Icons.Clear /> : <Icons.EditNote />}
          </IconButton>
        </ShortcutRow>
        {shortcuts.map(l => (
          <ShortcutRow key={`titlelink-${l.id}`} allowEdit={editMode} {...l} />
        ))}
        {editMode ? (
          <ShortcutRow
            title="Lisää linkki"
            icon={<AddExpenseIcon onClick={noop} />}
            onClick={createNewShortcut}
          />
        ) : null}
      </LinksArea>
      <ShortcutEditor />
    </>
  );
};

const ShortcutRow: React.FC<
  React.PropsWithChildren<ShortcutLinkProps & { allowEdit?: boolean }>
> = ({ id, expense, onClick, allowEdit, title, children, ...props }) => (
  <TitledRow>
    <Row
      onClick={
        onClick ??
        (expense ? () => createNewExpense(shortcutToExpenseInEditor(expense)) : undefined)
      }
      className={onClick || expense ? 'clickable' : undefined}
    >
      <ShortcutLink {...props} title={title} />
      <Title>{title}</Title>
    </Row>
    {children}
    {allowEdit && id ? (
      <>
        <Flex minWidth="32px" />
        <IconButton size="small" onClick={() => sortShortcutUp(id)}>
          <Icons.SortUp fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => sortShortcutDown(id)}>
          <Icons.SortDown fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => editShortcut(id)}>
          <Icons.Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => deleteShortcut(id)} style={{ marginRight: '4px' }}>
          <Icons.Delete fontSize="small" color="warning" />
        </IconButton>
      </>
    ) : null}
  </TitledRow>
);

async function createNewShortcut(): Promise<void> {
  const example = await requestNewExpense(async () => true, 'Uusi linkki');
  if (!example) {
    return;
  }
  const payload: ExpenseShortcutPayload = {
    title: example.title,
    expense: {
      title: example.title,
      benefit: example.benefit,
      categoryId: example.categoryId,
      subcategoryId: example.subcategoryId,
      confirmed: example.confirmed,
      receiver: example.receiver,
      sourceId: example.sourceId,
      type: example.type,
      sum: example.sum || undefined,
      description: example.description || undefined,
    },
  };
  await executeOperation(() => apiConnect.createShortcut(payload), {
    postProcess: updateSession,
    success: 'Linkki luotu',
  });
}

function deleteShortcut(shortcutId: ObjectId) {
  return executeOperation(() => apiConnect.deleteShortcut(shortcutId), {
    postProcess: updateSession,
    success: 'Linkki poistettu!',
  });
}

const sortShortcutUp = (shortcutId: ObjectId) =>
  executeOperation(() => apiConnect.shortShortcutUp(shortcutId), {
    postProcess: updateSession,
  });
const sortShortcutDown = (shortcutId: ObjectId) =>
  executeOperation(() => apiConnect.shortShortcutDown(shortcutId), {
    postProcess: updateSession,
  });

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
