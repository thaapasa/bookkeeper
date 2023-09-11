import { Grid, styled, Typography } from '@mui/material';
import debug from 'debug';
import * as React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';

import { colorScheme } from '../Colors';
import { UserPrompts } from '../dialog/DialogState';
import { ReceiverField } from '../expense/dialog/ReceiverField';
import { PageContentContainer } from '../Styles';
import { DbStatusView } from './DbStatusView';
import { ToolButton } from './ToolButton';

const log = debug('bookkeeper:tools');

export const ToolsView: React.FC = () => (
  <PageContentContainer className="padded">
    <Grid container rowGap="16px">
      <Grid item xs={12}>
        <Title>Työkalut</Title>
      </Grid>
      <ToolButton
        title="Vaihda kohteiden nimi"
        buttonText="Vaihda"
        action={changeReceiverName}
      />
      <DbStatusView />
    </Grid>
  </PageContentContainer>
);

async function changeReceiverName() {
  const oldName = await UserPrompts.promptText(
    'Valitse kohde',
    'Minkä kohteen nimen haluat muuttaa?',
    '',
    ReceiverField
  );
  if (!oldName) return;
  const newName = await UserPrompts.promptText(
    'Vaihda nimi',
    'Syötä uusi nimi kohteelle:',
    oldName
  );
  if (!newName) return;
  log(`Renaming ${oldName} to ${newName}`);
  await executeOperation(() => apiConnect.renameReceiver(oldName, newName), {
    success: m => `Muutettu ${oldName} → ${newName}: ${m.count} kirjausta`,
  });
}

const Title = styled(Typography)`
  border-bottom: 1px solid ${colorScheme.gray.standard};
`;
