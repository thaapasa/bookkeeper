import styled from '@emotion/styled';
import { Grid, IconButton } from '@mui/material';
import React from 'react';

import { ObjectId, TrackingSubject, TrackingSubjectWithData } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';

import { colorScheme } from '../Colors';
import { FlexRow } from '../component/BasicElements';
import { Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';
import { TrackingChart } from './TrackingChartRenderer';
import { editTrackingSubject } from './TrackingEditor';

export const TrackingSubjectsList: React.FC<{
  data: TrackingSubjectWithData[];
  onReload: () => void;
}> = ({ data, onReload }) => {
  return data.map(d => <TrackingSubjectView subject={d} key={d.id} onReload={onReload} />);
};

export const TrackingSubjectView: React.FC<{
  subject: TrackingSubjectWithData;
  onReload: () => void;
}> = ({ subject, onReload }) => {
  return (
    <Grid item xs={12} md={6}>
      <TrackingCard>
        {subject.image ? <TrackingImage src={subject.image} /> : null}
        <TrackingChart data={subject.data} trackingData={subject.trackingData} />
        <TitleArea>
          <TitleText>{subject.title}</TitleText>
          <ToolsArea>
            <IconButton
              size="small"
              title="Vaihda värejä"
              onClick={() => changeTrackingColors(subject.id, onReload)}
            >
              <Icons.Palette fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              title="Muokkaa seurantaa"
              onClick={() => editTrackingSubject(subject.id)}
            >
              <Icons.Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="warning"
              onClick={() => deleteSubject(subject, onReload)}
            >
              <Icons.Delete fontSize="small" />
            </IconButton>
          </ToolsArea>
        </TitleArea>
      </TrackingCard>
    </Grid>
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

const TrackingImage = styled('img')`
  width: 168px;
  height: 168px;
`;

const TitleText = styled(Subtitle)`
  padding-left: 12px;
  padding-top: 2px;
  font-size: 14pt;
  font-weight: bold;
  border: none;
`;

const TrackingCard = styled(FlexRow)`
  width: 100%;
  position: relative;
  border-radius: 8px;
  background-color: ${colorScheme.primary.standard};
  overflow: hidden;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
`;

const TitleArea = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background-color: #ffffffcc;
  z-index: 1;
`;

const ToolsArea = styled('div')`
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
`;
