import styled from '@emotion/styled';
import * as React from 'react';

import { NewExpenseDialogRoutes } from '../expense/dialog/NewExpenseDialogPage';
import { ShortcutsView } from '../shortcuts/ShortcutsView';

export const ShortcutsPage: React.FC = () => (
  <>
    <LinksContainer>
      <ShortcutsView />
    </LinksContainer>
    <NewExpenseDialogRoutes />
  </>
);

const LinksContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 24px;
`;
