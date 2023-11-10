import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
} from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { CategoryMap, ObjectId, TrackingFrequency, TrackingSubject } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

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

const FrequencyLabels: Record<TrackingFrequency, string> = {
  month: 'Kuukausi',
  quarter: 'Kvartaali',
  year: 'Vuosi',
};

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
          <SelectionRow title="Nimi">
            <TextEdit value={state.title} onChange={state.setTitle} fullWidth />
          </SelectionRow>
          <SelectionRow title="Värivaihtoehto">
            <TextEdit
              type="number"
              value={state.colorOffset}
              onChange={state.setColorOffset}
              width="40px"
            />
          </SelectionRow>
          <SelectionRow title="Seurantaväli">
            <Select value={state.range} onChange={e => state.setRange(e.target.value)} fullWidth>
              {state.getRangeOptions().map(o => (
                <MenuItem key={o.key} value={o.key}>
                  {o.title}
                </MenuItem>
              ))}
            </Select>
          </SelectionRow>
          <SelectionRow title="Seurannan tiheys">
            <Select
              value={state.frequency}
              onChange={e => state.setFrequency(e.target.value)}
              fullWidth
            >
              {TrackingFrequency.options.map(o => (
                <MenuItem key={o} value={o}>
                  {FrequencyLabels[o] ?? o}
                </MenuItem>
              ))}
            </Select>
          </SelectionRow>
          <SelectionRow title="Graafin tyyppi">
            <Select
              value={state.chartType}
              onChange={e => state.setChartType(e.target.value)}
              fullWidth
            >
              <MenuItem value="line">Viiva</MenuItem>
              <MenuItem value="bar">Palkki</MenuItem>
              <MenuItem value="combined">Yhdistetty</MenuItem>
            </Select>
          </SelectionRow>
          <SelectionRow title="Valinnat">
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.separateByUser}
                  onChange={() => state.setSeparateByUser(!state.separateByUser)}
                />
              }
              label="Käyttäjät erikseen"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.includeUserTotals}
                  disabled={!state.separateByUser}
                  onChange={() => state.setIncludeUserTotals(!state.includeUserTotals)}
                />
              }
              label="Myös yhteensä"
            />
          </SelectionRow>
          <SelectionRow title="Kuva">
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
          </SelectionRow>
          <Grid xs={12} item sx={{ position: 'relative' }}>
            <ToolIconArea>
              <IconButton title="Lisää kategoria" size="small" onClick={state.addCategory}>
                <Icons.Add fontSize="small" />
              </IconButton>
            </ToolIconArea>
            <Subtitle className="small">Kategoriat</Subtitle>
            {state.categories.map(c => (
              <CategorySelection id={c} key={c} categoryMap={categoryMap} />
            ))}
          </Grid>
          <Grid item xs={12}>
            <Row>
              <Flex />
              <Button color="inherit" onClick={onClose}>
                Peruuta
              </Button>
              <Button
                sx={{ marginLeft: 2 }}
                color="primary"
                variant="contained"
                disabled={!state.inputValid()}
                onClick={() => state.saveTracking(onClose, reloadAll)}
              >
                Tallenna
              </Button>
            </Row>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

const SelectionRow: React.FC<React.PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => (
  <>
    <Grid item xs={4}>
      {title}
    </Grid>
    <Grid item xs={8}>
      {children}
    </Grid>
  </>
);

const ToolIconArea = styled('div')`
  position: absolute;
  right: 0;
  top: 8px;
`;

const ConnectedEditView = connect(B.combineTemplate({ categoryMap: categoryMapE }))(
  TrackingEditView,
);

const CategorySelection: React.FC<{ id: ObjectId; categoryMap: CategoryMap }> = ({
  id,
  categoryMap,
}) => {
  const state = useTrackingState();
  return (
    <Row>
      {getFullCategoryName(id, categoryMap)}
      <Flex />
      <IconButton
        title="Poista seurannasta"
        color="warning"
        size="small"
        onClick={() => state.removeCategory(id)}
      >
        <Icons.Delete fontSize="small" />
      </IconButton>
    </Row>
  );
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
