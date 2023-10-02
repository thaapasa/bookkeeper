import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { ObjectId, TrackingSubject } from 'shared/types';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connectDialog } from '../component/DialogConnector';
import { TextEdit } from '../component/TextEdit';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';

const trackingBus = new B.Bus<{ trackingId: ObjectId | null }>();

export function editTrackingSubject(trackingId: ObjectId) {
  trackingBus.push({ trackingId });
}

export function newTrackingSubject() {
  trackingBus.push({ trackingId: null });
}

const TrackingDialogImpl: React.FC<{ trackingId: ObjectId | null; onClose: () => void }> = ({
  trackingId,
  onClose,
}) => {
  const { counter, forceReload } = useForceReload();
  const data = useAsyncData(getTrackingSubject, true, trackingId, counter);
  return (
    <Dialog fullWidth={true} open={true} onClose={onClose}>
      <AsyncDataDialogContent
        data={data}
        renderer={TrackingEditView}
        onClose={onClose}
        reloadData={forceReload}
      />
    </Dialog>
  );
};

function getTrackingSubject(
  shortcutId: ObjectId | null,
  _counter: number,
): Promise<TrackingSubject | null> {
  return shortcutId ? apiConnect.getTrackingSubject(shortcutId) : Promise.resolve(null);
}

const TrackingEditView: React.FC<{
  data: TrackingSubject | null;
  onClose: () => void;
  reloadData: () => void;
}> = ({ data, onClose }) => {
  const createNew = data === null;
  return (
    <>
      <DialogTitle>{createNew ? 'Uusi seuranta' : 'Muokkaa seurantaa'}</DialogTitle>
      <DialogContent>
        <Grid container rowSpacing={1} justifyContent="space-between">
          <Grid item xs={4}>
            Nimi
          </Grid>
          <Grid item xs={8}>
            <TextEdit value="" onChange={noop} fullWidth />
          </Grid>

          <Grid item xs="auto">
            <Button color="inherit" onClick={onClose}>
              Peruuta
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button color="primary" variant="contained" onClick={noop}>
              Tallenna
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

export const TrackingEditor = connectDialog(trackingBus, TrackingDialogImpl);
