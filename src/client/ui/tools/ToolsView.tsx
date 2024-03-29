import { Grid } from '@mui/material';
import * as React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Title } from '../design/Text';
import { UserPrompts } from '../dialog/DialogState';
import { ReceiverField } from '../expense/dialog/ReceiverField';
import { PageContentContainer } from '../Styles';
import { DbStatusView } from './DbStatusView';
import { ToolButton } from './ToolButton';

export const ToolsView: React.FC = () => (
  <PageContentContainer className="center">
    <Grid container rowSpacing={2} padding={2} maxWidth={800}>
      <Grid item xs={12}>
        <Title>Työkalut</Title>
      </Grid>
      <ToolButton title="Vaihda kohteiden nimi" buttonText="Vaihda" action={changeReceiverName} />
      <DbStatusView />
    </Grid>
  </PageContentContainer>
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
  });
}
