import styled from '@emotion/styled';
import { ScrollArea } from '@mantine/core';
import * as React from 'react';

import { NewExpenseDialogRoutes } from '../expense/dialog/NewExpenseDialogPage';
import { ShortcutsView } from '../shortcuts/ShortcutsView';

export const ShortcutsPage: React.FC = () => (
  <>
    <ScrollArea h="100%" type="auto" bg="neutral.1">
      <LinksContainer>
        <ShortcutsView />
      </LinksContainer>
    </ScrollArea>
    <NewExpenseDialogRoutes />
  </>
);

const LinksContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 24px;
`;
