import { Stack } from '@mantine/core';
import * as React from 'react';

import { toDateTime, toISODate } from 'shared/time';
import { apiConnect } from 'client/data/ApiConnect';
import { invalidateServerData } from 'client/data/query';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { PageTitle } from '../design/PageTitle';
import { UserPrompts } from '../dialog/DialogState';
import { ReceiverField } from '../expense/dialog/ReceiverField';
import { PageLayout } from '../layout/PageLayout';
import { DbStatusView } from './DbStatusView';
import { ToolButton } from './ToolButton';

export const ToolsView: React.FC = () => (
  <PageLayout>
    <Stack maw={300} mx="auto">
      <PageTitle>Työkalut</PageTitle>

      <ToolButton title="Vaihda kohteiden nimi" buttonText="Vaihda" action={changeReceiverName} />
      <ToolButton
        title="Poista etukäteen luodut toistuvat kirjaukset"
        buttonText="Poista"
        action={revertGeneratedRecurrences}
      />
      <DbStatusView />
    </Stack>
  </PageLayout>
);

async function revertGeneratedRecurrences() {
  // First date to delete from: everything after the current month.
  const from = toISODate(toDateTime().plus({ months: 1 }).startOf('month'));
  const confirmed = await UserPrompts.confirm(
    'Poista tulevat toistuvat kirjaukset',
    `Poistetaanko automaattisesti luodut toistuvat kirjaukset ${toDateTime(from).toFormat('d.M.yyyy')} alkaen? ` +
      'Muokatut kirjaukset säilytetään, ja poistetut luodaan tarvittaessa uudelleen.',
  );
  if (!confirmed) return;
  await executeOperation(() => apiConnect.revertGeneratedRecurrences(from), {
    success: r =>
      r.deletedCount > 0
        ? `Poistettu ${r.deletedCount} kirjausta (${r.subscriptionCount} toistuvaa)`
        : 'Ei poistettavia kirjauksia',
    postProcess: () => invalidateServerData(),
  });
}

async function changeReceiverName() {
  const oldName = await UserPrompts.promptText(
    'Valitse kohde',
    'Minkä kohteen nimen haluat muuttaa?',
    '',
    ReceiverField,
  );
  if (!oldName) return;
  const newName = await UserPrompts.promptText(
    'Vaihda nimi',
    'Syötä uusi nimi kohteelle:',
    oldName,
  );
  if (!newName) return;
  logger.info(`Renaming ${oldName} to ${newName}`);
  await executeOperation(() => apiConnect.renameReceiver(oldName, newName), {
    success: m => `Muutettu ${oldName} → ${newName}: ${m.count} kirjausta`,
    postProcess: () => invalidateServerData(),
  });
}
