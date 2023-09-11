import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseShortcutsList } from '../component/ExpenseShortcutsView';
import { PageContentContainer } from '../Styles';

export const ShortcutsView: React.FC = () => (
  <PageContentContainer>
    <LinksContainer>
      <ShortcutsList showTitles={true} />
    </LinksContainer>
  </PageContentContainer>
);

const LinksContainer = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 24px;
`;

const ShortcutsList = styled(ExpenseShortcutsList)`
  transform: scale(1.35) translateY(30px);
`;
