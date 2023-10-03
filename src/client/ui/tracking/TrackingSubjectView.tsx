import { Grid, IconButton } from '@mui/material';
import React from 'react';

import { TrackingSubject } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Icons } from '../icons/Icons';
import { editTrackingSubject } from './TrackingEditor';

export const TrackingSubjectsList: React.FC<{ data: TrackingSubject[]; onReload: () => void }> = ({
  data,
  onReload,
}) => {
  return data.map(d => <TrackingSubjectView subject={d} key={d.id} onReload={onReload} />);
};

export const TrackingSubjectView: React.FC<{ subject: TrackingSubject; onReload: () => void }> = ({
  subject,
  onReload,
}) => {
  return (
    <Grid item xs={12} md={6} container>
      <Grid xs={9} item>
        {subject.title}
      </Grid>
      <Grid xs={3} item>
        <IconButton
          size="small"
          title="Muokkaa seurantaa"
          onClick={() => editTrackingSubject(subject.id)}
        >
          <Icons.Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" color="warning" onClick={() => deleteSubject(subject, onReload)}>
          <Icons.Delete fontSize="small" />
        </IconButton>
      </Grid>
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
