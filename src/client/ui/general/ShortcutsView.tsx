import * as React from 'react';
import styled from 'styled-components';

import { ExpenseShortcutsList } from '../component/ExpenseShortcutsView';
import { PageContentContainer } from '../Styles';
import { AnyObject } from '../Types';

export default class ShortcutsView extends React.Component<AnyObject> {
  public render() {
    return (
      <PageContentContainer>
        <LinksContainer>
          <ShortcutsList showTitles={true} />
        </LinksContainer>
      </PageContentContainer>
    );
  }
}

const LinksContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 24px;
`;

const ShortcutsList = styled(ExpenseShortcutsList)`
  transform: scale(1.35) translateY(30px);
`;
