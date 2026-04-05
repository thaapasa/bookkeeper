import { ActionIcon, Box, Button, Checkbox, Group, Modal } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { CategoryMap, ExpenseGrouping, ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapP, getFullCategoryName } from 'client/data/Categories';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { ColorPicker } from '../component/ColorPicker';
import { OptionalDatePicker } from '../component/OptionalDatePicker';
import { TagsPicker } from '../component/TagsPicker';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadImageButton';
import { DialogHeading, Subtitle } from '../design/Text';
import { connectDialog } from '../dialog/DialogConnector';
import { useAsyncData } from '../hooks/useAsyncData';
import { useBaconProperty } from '../hooks/useBaconState';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import styles from './GroupingEditor.module.css';
import { useGroupingState } from './GroupingEditorState';

interface GroupingBusPayload {
  groupingId: ObjectId | null;
}

const groupingBus = new B.Bus<GroupingBusPayload>();

export function editExpenseGrouping(groupingId: ObjectId) {
  groupingBus.push({ groupingId });
}

export function newExpenseGrouping() {
  groupingBus.push({ groupingId: null });
}

const GroupingDialogImpl: React.FC<{
  groupingId: ObjectId | null;
  onClose: () => void;
  reloadAll: () => void;
}> = ({ groupingId, onClose, reloadAll }) => {
  const { counter, forceReload } = useForceReload();
  const data = useAsyncData(getExpenseGrouping, true, groupingId, counter);
  return (
    <Modal opened={true} onClose={onClose} size="lg" title="">
      <AsyncDataDialogContent
        data={data}
        renderer={GroupingEditView}
        onClose={onClose}
        reloadData={forceReload}
        reloadAll={reloadAll}
      />
    </Modal>
  );
};

function getExpenseGrouping(
  groupingId: ObjectId | null,
  _counter: number,
): Promise<ExpenseGrouping | null> {
  return groupingId ? apiConnect.getExpenseGrouping(groupingId) : Promise.resolve(null);
}

const GroupingEditView: React.FC<{
  data: ExpenseGrouping | null;
  onClose: () => void;
  reloadData: () => void;
  reloadAll: () => void;
}> = ({ data, onClose, reloadAll, reloadData }) => {
  const categoryMap = useBaconProperty(categoryMapP);
  const createNew = data === null;
  const state = useGroupingState();
  const tags = useAsyncData(apiConnect.getExpenseGroupingTags, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => void state.reset(data), [data?.id]);

  return (
    <>
      <DialogHeading>{createNew ? 'Uusi ryhmittely' : 'Muokkaa ryhmittelyä'}</DialogHeading>
      <Box
        display="grid"
        style={{
          gridTemplateColumns: 'auto 1fr',
          gap: 'var(--mantine-spacing-xs)',
          alignItems: 'center',
        }}
      >
        <SelectionRow title="Nimi">
          <TextEdit value={state.title} onChange={state.setTitle} />
        </SelectionRow>
        <SelectionRow title="Valinnat">
          <Checkbox
            checked={state.private}
            onChange={e => state.setPrivate(e.currentTarget.checked)}
            label="Yksityinen"
          />
          <Checkbox
            checked={state.onlyOwn}
            onChange={e => state.setOnlyOwn(e.currentTarget.checked)}
            label="Vain omat kirjaukset"
          />
        </SelectionRow>
        <SelectionRow title="Alkupäivä">
          <OptionalDatePicker value={state.startDate} onChange={state.setStartDate} />
        </SelectionRow>
        <SelectionRow title="Loppupäivä">
          <OptionalDatePicker value={state.endDate} onChange={state.setEndDate} />
        </SelectionRow>
        <SelectionRow title="Väri">
          <ColorPicker value={state.color} onChange={state.setColor} />
        </SelectionRow>
        <SelectionRow title="Tagit">
          <TagsPicker
            value={state.tags}
            onAdd={state.addTag}
            onRemove={state.removeTag}
            presetValues={tags.type === 'loaded' ? tags.value : []}
          />
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
        <Box pos="relative" style={{ gridColumn: '1 / -1' }}>
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
              onClick={() => state.saveGrouping(onClose, reloadAll)}
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
  const state = useGroupingState();
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

export const GroupingEditor = connectDialog<GroupingBusPayload, { reloadAll: () => void }>(
  groupingBus,
  GroupingDialogImpl,
);
