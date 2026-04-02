import { Box, Flex } from '@mantine/core';
import * as React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Title } from '../design/Text';
import { UserPrompts } from '../dialog/DialogState';
import { ReceiverField } from '../expense/dialog/ReceiverField';
import { DbStatusView } from './DbStatusView';
import { ToolButton } from './ToolButton';
import styles from './ToolsView.module.css';

export const ToolsView: React.FC = () => (
  <Flex direction="column" align="center">
    <Box className={styles.grid}>
      <Box style={{ gridColumn: '1 / -1' }}>
        <Title>Työkalut</Title>
      </Box>
      <ToolButton title="Vaihda kohteiden nimi" buttonText="Vaihda" action={changeReceiverName} />
      <DbStatusView />
    </Box>
  </Flex>
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
