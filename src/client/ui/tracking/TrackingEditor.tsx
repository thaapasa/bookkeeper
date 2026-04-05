import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Select as MantineSelect,
  Stack,
} from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { CategoryMap, ObjectId, TrackingFrequency, TrackingSubject } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapP, getFullCategoryName } from 'client/data/Categories';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadImageButton';
import { DialogHeading, Subtitle } from '../design/Text';
import { connectDialog } from '../dialog/DialogConnector';
import { useAsyncData } from '../hooks/useAsyncData';
import { useBaconProperty } from '../hooks/useBaconState';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import styles from './TrackingEditor.module.css';
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
        renderer={TrackingEditView}
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
}> = ({ data, onClose, reloadAll, reloadData }) => {
  const categoryMap = useBaconProperty(categoryMapP);
  const createNew = data === null;
  const state = useTrackingState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => void state.reset(data), [data?.id]);

  return (
    <>
      <DialogHeading>{createNew ? 'Uusi seuranta' : 'Muokkaa seurantaa'}</DialogHeading>
      <Box
        display="grid"
        style={{
          gridTemplateColumns: 'auto 1fr',
          gap: 'var(--mantine-spacing-sm)',
          alignItems: 'center',
        }}
      >
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
          <Stack gap="xs">
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
          </Stack>
        </SelectionRow>
        <SelectionRow title="Kuva">
          <Group wrap="nowrap">
            <Box className={styles.imageArea}>
              {data?.image ? (
                <img src={data.image} alt="" style={{ width: 128, height: 128 }} />
              ) : (
                <Icons.Image fontSize="large" />
              )}
            </Box>
            <Box flex={1} />
            <UploadImageButton
              onSelect={(file, filename) =>
                state.uploadImage(file, filename, reloadData, reloadAll)
              }
              title="Lataa kuva"
            >
              <Icons.Upload />
            </UploadImageButton>
            <ActionIcon
              onClick={() => state.removeImage(reloadData, reloadAll)}
              title="Poista kuva"
            >
              <Icons.Delete />
            </ActionIcon>
          </Group>
        </SelectionRow>
        <Box style={{ gridColumn: '1 / -1' }} pos="relative">
          <Box pos="absolute" right={0} top="xs">
            <ActionIcon title="Lisää kategoria" size="sm" onClick={state.addCategory}>
              <Icons.Add fontSize="small" />
            </ActionIcon>
          </Box>
          <Subtitle order={3}>Kategoriat</Subtitle>
          {state.categories.map(c => (
            <CategorySelectionRow id={c} key={c} categoryMap={categoryMap} />
          ))}
        </Box>
        <Box style={{ gridColumn: '1 / -1' }}>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Peruuta
            </Button>
            <Button
              ml="md"
              variant="filled"
              disabled={!state.inputValid()}
              onClick={() => state.saveTracking(onClose, reloadAll)}
            >
              Tallenna
            </Button>
          </Group>
        </Box>
      </Box>
    </>
  );
};

const SelectionRow: React.FC<React.PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => (
  <>
    <Box>{title}</Box>
    <Box>{children}</Box>
  </>
);

const CategorySelectionRow: React.FC<{ id: ObjectId; categoryMap: CategoryMap }> = ({
  id,
  categoryMap,
}) => {
  const state = useTrackingState();
  return (
    <Group>
      {getFullCategoryName(id, categoryMap)}
      <Box flex={1} />
      <ActionIcon title="Poista seurannasta" size="sm" onClick={() => state.removeCategory(id)}>
        <Icons.Delete fontSize="small" />
      </ActionIcon>
    </Group>
  );
};

export const TrackingEditor = connectDialog<TrackingBusPayload, { reloadAll: () => void }>(
  trackingBus,
  TrackingDialogImpl,
);
