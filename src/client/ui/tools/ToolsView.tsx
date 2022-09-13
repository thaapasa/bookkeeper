import { Button, Grid, Typography } from '@mui/material';
import debug from 'debug';
import * as React from 'react';
import styled from 'styled-components';

import apiConnect from 'client/data/ApiConnect';

import { colorScheme } from '../Colors';
import { UserPrompts } from '../dialog/DialogState';
import { ReceiverField } from '../expense/dialog/ReceiverField';
import { PageContentContainer } from '../Styles';

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
    </Grid>
  </PageContentContainer>
);

const ToolButton: React.FC<{
  title: string;
  action: () => PromiseLike<any>;
  buttonText: string;
}> = ({ title, action, buttonText }) => (
  <>
    <Grid item xs={4}>
      {title}
    </Grid>
    <Grid item xs={8}>
      <Button onClick={action} variant="contained" color="primary">
        {buttonText}
      </Button>
    </Grid>
  </>
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
  await apiConnect.renameReceiver(oldName, newName);
}

const Title = styled(Typography)`
  border-bottom: 1px solid ${colorScheme.gray.standard};
`;
