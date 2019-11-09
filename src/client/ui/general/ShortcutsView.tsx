import * as React from 'react';
import { PageContentContainer } from '../Styles';
import { ExpenseShortcutsList } from '../component/ExpenseShortcutsView';
import styled from 'styled-components';

export default class ShortcutsView extends React.Component<{}> {
  public render() {
    return (
      <PageContentContainer>
        <LinksContainer>
          <ExpenseShortcutsList showTitles={true} />
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
