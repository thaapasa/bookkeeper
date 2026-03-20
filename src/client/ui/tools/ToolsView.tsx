import styled from '@emotion/styled';
import { Flex, ScrollArea } from '@mantine/core';
import * as React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Title } from '../design/Text';
import { UserPrompts } from '../dialog/DialogState';
import { ReceiverField } from '../expense/dialog/ReceiverField';
import { DbStatusView } from './DbStatusView';
import { ToolButton } from './ToolButton';

export const ToolsView: React.FC = () => (
  <ScrollArea h="100%" type="auto">
    <Flex direction="column" align="center">
      <ToolsGrid>
        <FullWidth>
          <Title>Työkalut</Title>
        </FullWidth>
        <ToolButton title="Vaihda kohteiden nimi" buttonText="Vaihda" action={changeReceiverName} />
        <DbStatusView />
      </ToolsGrid>
    </Flex>
  </ScrollArea>
);

const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  padding: 16px;
  max-width: 800px;
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

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
