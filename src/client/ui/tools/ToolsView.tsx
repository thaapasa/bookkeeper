import { Stack } from '@mantine/core';
import * as React from 'react';

import { apiConnect } from 'client/data/ApiConnect';
import { invalidateExpenseData, queryClient } from 'client/data/query';
import { QueryKeys } from 'client/data/queryKeys';
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
      <DbStatusView />
    </Stack>
  </PageLayout>
);

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
    postProcess: () => {
      invalidateExpenseData();
      queryClient.invalidateQueries({ queryKey: QueryKeys.receivers.all });
    },
  });
}
