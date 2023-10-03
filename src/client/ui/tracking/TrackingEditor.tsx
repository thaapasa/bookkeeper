import styled from '@emotion/styled';
import { Button, Dialog, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { CategoryMap, ObjectId, TrackingSubject } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connect } from '../component/BaconConnect';
import { connectDialog } from '../component/DialogConnector';
import { Row } from '../component/Row';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadFileButton';
import { checkersBackground } from '../design/Background';
import { Subtitle } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
import { useTrackingState } from './TrackingEditorState';

interface TrackingBusPayload {
  trackingId: ObjectId | null;
}

const trackingBus = new B.Bus<TrackingBusPayload>();

export function editTrackingSubject(trackingId: ObjectId) {
  trackingBus.push({ trackingId });
}

export function newTrackingSubject() {
  trackingBus.push({ trackingId: null });
}

const TrackingDialogImpl: React.FC<{
  trackingId: ObjectId | null;
  onClose: () => void;
  reloadAll: () => void;
}> = ({ trackingId, onClose, reloadAll }) => {
  const { counter, forceReload } = useForceReload();
  const data = useAsyncData(getTrackingSubject, true, trackingId, counter);
  return (
    <Dialog fullWidth={true} open={true} onClose={onClose}>
      <AsyncDataDialogContent
        data={data}
        renderer={ConnectedEditView}
        onClose={onClose}
        reloadData={forceReload}
        reloadAll={reloadAll}
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
  reloadAll: () => void;
  categoryMap: CategoryMap;
}> = ({ data, onClose, reloadAll, reloadData, categoryMap }) => {
  const createNew = data === null;
  const state = useTrackingState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => void state.reset(data), [data?.id]);
  return (
    <>
      <DialogTitle>{createNew ? 'Uusi seuranta' : 'Muokkaa seurantaa'}</DialogTitle>
      <DialogContent>
        <Grid container rowSpacing={1} justifyContent="space-between">
          <Grid item xs={4}>
            Nimi
          </Grid>
          <Grid item xs={8}>
            <TextEdit value={state.title} onChange={state.setTitle} fullWidth />
          </Grid>
          <Grid item xs={4}>
            Kuva
          </Grid>
          <Grid item xs={8}>
            <Row>
              <ImageArea>
                {data?.image ? <TrackingImg src={data?.image} /> : <Icons.Image fontSize="large" />}
              </ImageArea>
              <Flex />
              <UploadImageButton
                onSelect={(file, filename) =>
                  state.uploadImage(file, filename, reloadData, reloadAll)
                }
                title="Lataa kuva"
              >
                <Icons.Upload />
              </UploadImageButton>
              <IconButton
                onClick={() => state.removeImage(reloadData, reloadAll)}
                title="Poista kuva"
              >
                <Icons.Delete />
              </IconButton>
            </Row>
          </Grid>
          <Grid xs={12} item>
            <Subtitle className="small">Kategoriat</Subtitle>
            {state.categories.map(c => (
              <CategorySelection id={c} key={c} categoryMap={categoryMap} />
            ))}
            <IconButton title="Lisää kategoria" size="small" onClick={state.addCategory}>
              <Icons.Add fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item xs="auto">
            <Button color="inherit" onClick={onClose}>
              Peruuta
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button
              color="primary"
              variant="contained"
              disabled={!state.inputValid()}
              onClick={() => state.saveTracking(onClose, reloadAll)}
            >
              Tallenna
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

const ConnectedEditView = connect(B.combineTemplate({ categoryMap: categoryMapE }))(
  TrackingEditView,
);

const CategorySelection: React.FC<{ id: ObjectId; categoryMap: CategoryMap }> = ({
  id,
  categoryMap,
}) => {
  const cat = categoryMap[id];
  return <Row>{cat.name}</Row>;
};

export const TrackingEditor = connectDialog<TrackingBusPayload, { reloadAll: () => void }>(
  trackingBus,
  TrackingDialogImpl,
);

const ImageArea = styled('div')`
  width: 128px;
  height: 128px;
  position: relative;
  ${checkersBackground({ size: 8, color: '#eee' })}
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TrackingImg = styled('img')`
  width: 128px;
  height: 128px;
`;
