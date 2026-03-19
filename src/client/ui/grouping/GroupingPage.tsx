import styled from '@emotion/styled';
import { ActionIcon } from '@mantine/core';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';

import { AsyncDataView } from '../component/AsyncDataView';
import { Title } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { PageContentContainer } from '../Styles';
import { ExpenseGroupingsList } from './ExpenseGroupingsView';
import { GroupingEditor, newExpenseGrouping } from './GroupingEditor';

export const GroupingPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
  const expenseGroupings = useAsyncData(loadGroupings, true, counter);
  const tags = useAsyncData(loadTags, true, counter);
  return (
    <PageContentContainer className="center">
      <PageGrid>
        <TitleRow>
          <Title>Ryhmittelyt</Title>
          <ToolArea>
            <ActionIcon variant="subtle" title="Uusi ryhmittely" onClick={newExpenseGrouping}>
              <Icons.AddChart />
            </ActionIcon>
          </ToolArea>
        </TitleRow>
        <AsyncDataView
          data={expenseGroupings}
          renderer={ExpenseGroupingsList}
          onReload={forceReload}
          allTags={tags.type === 'loaded' ? tags.value : []}
        />
      </PageGrid>
      <GroupingEditor reloadAll={forceReload} />
    </PageContentContainer>
  );
};

function loadGroupings(_counter: number) {
  return apiConnect.getExpenseGroupings();
}

function loadTags(_counter: number) {
  return apiConnect.getExpenseGroupingTags();
}

const PageGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: calc(100% - 32px);
  padding-bottom: 32px;
`;

const TitleRow = styled.div`
  position: relative;
  margin-top: 16px;
`;

const ToolArea = styled.div`
  position: absolute;
  right: 0;
  bottom: 16px;
`;
