import styled from '@emotion/styled';
import { Grid, IconButton } from '@mui/material';
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
  return (
    <PageContentContainer className="center">
      <Grid container columnSpacing={2} rowSpacing={2} width="calc(100% - 32px)">
        <RGrid item xs={12} marginTop={2}>
          <Title>Ryhmittelyt</Title>
          <ToolArea>
            <IconButton title="Uusi ryhmittely" onClick={newExpenseGrouping}>
              <Icons.AddChart />
            </IconButton>
          </ToolArea>
        </RGrid>
        <AsyncDataView
          data={expenseGroupings}
          renderer={ExpenseGroupingsList}
          onReload={forceReload}
        />
      </Grid>
      <GroupingEditor reloadAll={forceReload} />
    </PageContentContainer>
  );
};

function loadGroupings(_counter: number) {
  return apiConnect.getExpenseGroupings();
}

const RGrid = styled(Grid)`
  position: relative;
`;

const ToolArea = styled('div')`
  position: absolute;
  right: 0;
  bottom: 16px;
`;
