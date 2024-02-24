import styled from '@emotion/styled';
import { Grid, IconButton } from '@mui/material';
import React from 'react';

import { Title } from '../design/Text';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { PageContentContainer } from '../Styles';
import { GroupingEditor, newExpenseGrouping } from './GroupingEditor';

export const GroupingPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
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
      </Grid>
      <GroupingEditor reloadAll={forceReload} />
    </PageContentContainer>
  );
};

const RGrid = styled(Grid)`
  position: relative;
`;

const ToolArea = styled('div')`
  position: absolute;
  right: 0;
  bottom: 16px;
`;
