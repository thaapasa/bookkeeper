import { styled } from '@mui/material';
import * as React from 'react';

import { NewExpenseDialogRoutes } from '../expense/dialog/NewExpenseDialogPage';
import { ShortcutsView } from '../shortcuts/ShortcutsView';
import { PageContentContainer } from '../Styles';

export const ShortcutsPage: React.FC = () => (
  <>
    <PageContentContainer>
      <LinksContainer>
        <ShortcutsView />
      </LinksContainer>
    </PageContentContainer>
    <NewExpenseDialogRoutes />
  </>
);

const LinksContainer = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 24px;
`;
