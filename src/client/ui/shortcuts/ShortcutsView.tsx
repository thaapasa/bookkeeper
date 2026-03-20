import styled from '@emotion/styled';
import { ActionIcon } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { ExpenseShortcut, ExpenseShortcutPayload } from 'shared/expense';
import { uri } from 'shared/net';
import { ObjectId } from 'shared/types';
import { noop, spaced } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateSession, validSessionP } from 'client/data/Login';
import { createNewExpense, navigationP, requestNewExpense } from 'client/data/State';
import { executeOperation } from 'client/util/ExecuteOperation';
import { newExpenseSuffix } from 'client/util/Links';

import { primary } from '../Colors';
import { connect } from '../component/BaconConnect';
import { Row } from '../component/Row';
import { useToggle } from '../hooks/useToggle';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { editShortcut, ShortcutEditor } from './ShortcutEditor';
import { ShortcutLink, ShortcutLinkProps } from './ShortcutLink';

/**
 * This is the list of shortcut links, shown in it's own page. This allows creating new shortcuts and editing the existing ones.
 */
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
          <ActionIcon variant="subtle" onClick={toggleEdit}>
            {editMode ? <Icons.Clear /> : <Icons.EditNote />}
          </ActionIcon>
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
> = ({ id, expense, onClick, allowEdit, title, children, ...props }) => {
  const navigate = useNavigate();
  return (
    <TitledRow>
      <Row
        onClick={onClick ?? (id ? () => openNewExpenseFromShortcutDialog(navigate, id) : undefined)}
        className={onClick || expense ? 'clickable' : undefined}
      >
        <ShortcutLink {...props} title={title} />
        <Title>{title}</Title>
      </Row>
      {children}
      {allowEdit && id ? (
        <>
          <Flex minWidth="32px" />
          <ActionIcon variant="subtle" size="sm" onClick={() => sortShortcutUp(id)}>
            <Icons.SortUp fontSize="small" />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm" onClick={() => sortShortcutDown(id)}>
            <Icons.SortDown fontSize="small" />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm" onClick={() => editShortcut(id)}>
            <Icons.Edit fontSize="small" />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            size="sm"
            color="red"
            onClick={() => deleteShortcut(id)}
            style={{ marginRight: '4px' }}
          >
            <Icons.Delete fontSize="small" />
          </ActionIcon>
        </>
      ) : null}
    </TitledRow>
  );
};

function openNewExpenseFromShortcutDialog(navigate: NavigateFunction, id: ObjectId) {
  const path = window.location.pathname;
  if (!path.includes(newExpenseSuffix)) {
    const base = path.startsWith('/p') ? path + newExpenseSuffix : '/p' + newExpenseSuffix;
    navigate(base + uri`/${id}`);
  }
}

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

const TitledRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  align-self: stretch;
`;

const Title = styled.div`
  font-size: var(--mantine-font-size-sm);
  margin-left: 8px;
  color: ${primary[7]};
`;

export const ShortcutsView = connect(
  B.combineTemplate({ session: validSessionP, navigation: navigationP }).map(
    ({ session, navigation }) => ({
      shortcuts: session.shortcuts || [],
      dateRange: navigation.dateRange,
    }),
  ),
)(FullList);

const LinksArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  &.with-titles {
    align-items: flex-start;
  }
`;
