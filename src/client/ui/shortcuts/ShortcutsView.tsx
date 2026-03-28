import { ActionIcon, Button, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { ExpenseShortcut, ExpenseShortcutPayload } from 'shared/expense';
import { uri } from 'shared/net';
import { ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession, validSessionP } from 'client/data/Login';
import { createNewExpense, navigationP, requestNewExpense } from 'client/data/State';
import { executeOperation } from 'client/util/ExecuteOperation';
import { newExpenseSuffix } from 'client/util/Links';

import { connect } from '../component/BaconConnect';
import { Icons } from '../icons/Icons';
import { editShortcut, ShortcutEditor } from './ShortcutEditor';
import { ShortcutLink } from './ShortcutLink';

/**
 * Management view for shortcut links.
 * Shows an ordered list with always-visible edit/reorder/delete controls.
 */
const FullList: React.FC<{
  shortcuts: ExpenseShortcut[];
}> = ({ shortcuts }) => {
  const navigate = useNavigate();
  return (
    <>
      <Stack gap={0}>
        {shortcuts.map((s, i) => (
          <Group
            key={s.id}
            gap="xs"
            wrap="nowrap"
            py="xs"
            style={{ borderBottom: 'var(--mantine-border)', alignItems: 'center' }}
          >
            <UnstyledButton
              onClick={() => openNewExpenseFromShortcutDialog(navigate, s.id)}
              style={{ flex: 1, minWidth: 0 }}
            >
              <Group gap="md" wrap="nowrap">
                <ShortcutLink
                  title={s.title}
                  icon={s.icon}
                  background={s.background}
                  style={{ margin: 0, flexShrink: 0 }}
                />
                <Text fz="sm" c="primary.7" truncate>
                  {s.title}
                </Text>
              </Group>
            </UnstyledButton>
            <Group gap={4} wrap="nowrap">
              <ActionIcon size="sm" disabled={i === 0} onClick={() => sortShortcutUp(s.id)}>
                <Icons.SortUp fontSize="small" />
              </ActionIcon>
              <ActionIcon
                size="sm"
                disabled={i === shortcuts.length - 1}
                onClick={() => sortShortcutDown(s.id)}
              >
                <Icons.SortDown fontSize="small" />
              </ActionIcon>
              <ActionIcon size="sm" onClick={() => editShortcut(s.id)}>
                <Icons.Edit fontSize="small" />
              </ActionIcon>
              <ActionIcon size="sm" color="red" onClick={() => deleteShortcut(s.id)}>
                <Icons.Delete fontSize="small" />
              </ActionIcon>
            </Group>
          </Group>
        ))}
      </Stack>
      <Group mt="md" gap="sm">
        <Button
          variant="light"
          size="sm"
          leftSection={<Icons.Add size={16} />}
          onClick={createNewShortcut}
        >
          Lisää linkki
        </Button>
        <Button
          variant="subtle"
          size="sm"
          leftSection={<Icons.PlusCircle size={16} />}
          onClick={() => createNewExpense({})}
        >
          Uusi kirjaus
        </Button>
      </Group>
      <ShortcutEditor />
    </>
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

export const ShortcutsView = connect(
  B.combineTemplate({ session: validSessionP, navigation: navigationP }).map(
    ({ session, navigation }) => ({
      shortcuts: session.shortcuts || [],
      dateRange: navigation.dateRange,
    }),
  ),
)(FullList);
