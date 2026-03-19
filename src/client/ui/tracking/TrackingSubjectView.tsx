import styled from '@emotion/styled';
import { ActionIcon } from '@mantine/core';
import React from 'react';

import { ObjectId, TrackingSubject, TrackingSubjectWithData } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';

import { colorScheme } from '../Colors';
import { FlexColumn, FlexRow } from '../component/BasicElements';
import { Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';
import { media } from '../Styles';
import { TrackingChart } from './TrackingChartRenderer';
import { editTrackingSubject } from './TrackingEditor';

export const TrackingSubjectsList: React.FC<{
  data: TrackingSubjectWithData[];
  onReload: () => void;
}> = ({ data, onReload }) => {
  return (
    <SubjectsGrid>
      {data.map(d => <TrackingSubjectView subject={d} key={d.id} onReload={onReload} />)}
    </SubjectsGrid>
  );
};

export const TrackingSubjectView: React.FC<{
  subject: TrackingSubjectWithData;
  onReload: () => void;
}> = ({ subject, onReload }) => {
  return (
    <TrackingCard>
      <TitleArea className="title-area">
        <TitleText>{subject.title}</TitleText>
        <ToolsArea className="tools-area">
          <ActionIcon variant="subtle"
            size="sm"
            title="Vaihda värejä"
            onClick={() => changeTrackingColors(subject.id, onReload)}
          >
            <Icons.Palette fontSize="small" />
          </ActionIcon>
          <ActionIcon variant="subtle"
            size="sm"
            title="Muokkaa seurantaa"
            onClick={() => editTrackingSubject(subject.id)}
          >
            <Icons.Edit fontSize="small" />
          </ActionIcon>
          <ActionIcon variant="subtle"
            size="sm"
            onClick={() => deleteSubject(subject, onReload)}
          >
            <Icons.Delete fontSize="small" />
          </ActionIcon>
        </ToolsArea>
      </TitleArea>
      <TrackingArea className="tracking-area">
        {subject.image ? <TrackingImage src={subject.image} /> : null}
        <TrackingChart
          data={subject.data}
          trackingData={subject.trackingData}
          className="tracking-chart"
        />
      </TrackingArea>
    </TrackingCard>
  );
};

async function deleteSubject(subject: TrackingSubject, onReload: () => void) {
  await executeOperation(() => apiConnect.deleteTrackingSubject(subject.id), {
    confirm: `Haluatko varmasti poistaa seurannan '${subject.title}'?`,
    success: 'Seuranta poistettu!',
    postProcess: onReload,
  });
}

async function changeTrackingColors(subjectId: ObjectId, onReload: () => void) {
  await executeOperation(() => apiConnect.changeTrackingColors(subjectId), {
    postProcess: onReload,
  });
}

const SubjectsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  ${media.web`grid-template-columns: 1fr 1fr;`}
`;

const TrackingImage = styled.img`
  width: 168px;
  height: 168px;
`;

const TitleText = styled(Subtitle)`
  padding-left: 12px;
  padding-top: 2px;
  font-size: var(--mantine-font-size-lg);
  font-weight: bold;
  border: none;
`;

const TrackingCard = styled(FlexColumn)`
  width: 100%;
  position: relative;
  height: 200px;
  border-radius: 8px;
  background-color: ${colorScheme.primary.standard};
  overflow: hidden;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
`;

const TrackingArea = styled(FlexRow)`
  flex: 1;
`;

const TitleArea = styled.div`
  height: 32px;
  background-color: ${colorScheme.primary.light}aa;
  z-index: 1;
`;

const ToolsArea = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
`;
