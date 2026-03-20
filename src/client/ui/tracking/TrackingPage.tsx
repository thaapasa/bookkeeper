import styled from '@emotion/styled';
import { ActionIcon, Flex, ScrollArea } from '@mantine/core';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';

import { AsyncDataView } from '../component/AsyncDataView';
import { Title } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { newTrackingSubject, TrackingEditor } from './TrackingEditor';
import { TrackingSubjectsList } from './TrackingSubjectView';

export const TrackingPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
  const trackedSubjects = useAsyncData(loadSubjects, true, counter);
  return (
    <ScrollArea h="100%" type="auto">
      <Flex direction="column" align="center">
        <PageGrid>
          <TitleRow>
            <Title>Seuranta</Title>
            <ToolArea>
              <ActionIcon variant="subtle" title="Uusi seuranta" onClick={newTrackingSubject}>
                <Icons.AddChart />
              </ActionIcon>
            </ToolArea>
          </TitleRow>
          <AsyncDataView
            data={trackedSubjects}
            renderer={TrackingSubjectsList}
            onReload={forceReload}
          />
        </PageGrid>
        <TrackingEditor reloadAll={forceReload} />
      </Flex>
    </ScrollArea>
  );
};

function loadSubjects(_counter: number) {
  return apiConnect.getTrackingSubjects();
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
