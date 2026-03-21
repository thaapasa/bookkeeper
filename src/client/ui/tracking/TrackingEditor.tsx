import styled from '@emotion/styled';
import { ActionIcon, Button, Checkbox, Modal, Select as MantineSelect } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { CategoryMap, ObjectId, TrackingFrequency, TrackingSubject } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapP, getFullCategoryName } from 'client/data/Categories';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connect } from '../component/BaconConnect';
import { Row } from '../component/Row';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadImageButton';
import { checkersBackground } from '../design/Background';
import { Subtitle } from '../design/Text';
import { connectDialog } from '../dialog/DialogConnector';
import { Flex } from '../GlobalStyles';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
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
    <Modal opened={true} onClose={onClose} size="lg" title="">
      <AsyncDataDialogContent
        data={data}
        renderer={ConnectedEditView}
        onClose={onClose}
        reloadData={forceReload}
        reloadAll={reloadAll}
      />
    </Modal>
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
      <h3 style={{ margin: '0 0 16px' }}>{createNew ? 'Uusi seuranta' : 'Muokkaa seurantaa'}</h3>
      <div>
        <EditorGrid>
          <SelectionRow title="Nimi">
            <TextEdit value={state.title} onChange={state.setTitle} />
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
            <MantineSelect
              value={state.range}
              onChange={val => val && state.setRange(val)}
              data={state.getRangeOptions().map(o => ({ value: o.key, label: o.title }))}
            />
          </SelectionRow>
          <SelectionRow title="Seurannan tiheys">
            <MantineSelect
              value={state.frequency}
              onChange={val => val && state.setFrequency(val)}
              data={TrackingFrequency.options.map(o => ({
                value: o,
                label: FrequencyLabels[o] ?? o,
              }))}
            />
          </SelectionRow>
          <SelectionRow title="Graafin tyyppi">
            <MantineSelect
              value={state.chartType}
              onChange={val => val && state.setChartType(val)}
              data={[
                { value: 'line', label: 'Viiva' },
                { value: 'bar', label: 'Palkki' },
                { value: 'combined', label: 'Yhdistetty' },
              ]}
            />
          </SelectionRow>
          <SelectionRow title="Valinnat">
            <Checkbox
              checked={state.separateByUser}
              onChange={() => state.setSeparateByUser(!state.separateByUser)}
              label="Käyttäjät erikseen"
            />
            <Checkbox
              checked={state.includeUserTotals}
              disabled={!state.separateByUser}
              onChange={() => state.setIncludeUserTotals(!state.includeUserTotals)}
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
              <ActionIcon
                variant="subtle"
                onClick={() => state.removeImage(reloadData, reloadAll)}
                title="Poista kuva"
              >
                <Icons.Delete />
              </ActionIcon>
            </Row>
          </SelectionRow>
          <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
            <ToolIconArea>
              <ActionIcon
                variant="subtle"
                title="Lisää kategoria"
                size="sm"
                onClick={state.addCategory}
              >
                <Icons.Add fontSize="small" />
              </ActionIcon>
            </ToolIconArea>
            <Subtitle order={3}>Kategoriat</Subtitle>
            {state.categories.map(c => (
              <CategorySelection id={c} key={c} categoryMap={categoryMap} />
            ))}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Row>
              <Flex />
              <Button variant="subtle" onClick={onClose}>
                Peruuta
              </Button>
              <Button
                style={{ marginLeft: 16 }}
                variant="filled"
                disabled={!state.inputValid()}
                onClick={() => state.saveTracking(onClose, reloadAll)}
              >
                Tallenna
              </Button>
            </Row>
          </div>
        </EditorGrid>
      </div>
    </>
  );
};

const SelectionRow: React.FC<React.PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => (
  <>
    <div>{title}</div>
    <div>{children}</div>
  </>
);

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
`;

const ToolIconArea = styled.div`
  position: absolute;
  right: 0;
  top: 8px;
`;

const ConnectedEditView = connect(B.combineTemplate({ categoryMap: categoryMapP }))(
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
      <ActionIcon
        variant="subtle"
        title="Poista seurannasta"
        size="sm"
        onClick={() => state.removeCategory(id)}
      >
        <Icons.Delete fontSize="small" />
      </ActionIcon>
    </Row>
  );
};

export const TrackingEditor = connectDialog<TrackingBusPayload, { reloadAll: () => void }>(
  trackingBus,
  TrackingDialogImpl,
);

const ImageArea = styled.div`
  width: 128px;
  height: 128px;
  position: relative;
  ${checkersBackground({ size: 8 })}
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TrackingImg = styled.img`
  width: 128px;
  height: 128px;
`;
