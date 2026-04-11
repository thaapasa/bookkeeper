import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  Group,
  Loader,
  Modal,
  Stack,
} from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import * as React from 'react';
import { create } from 'zustand';

import { CategoryMap, ExpenseGrouping, ObjectId } from 'shared/types';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { getFullCategoryName } from 'client/data/Categories';
import { QueryKeys } from 'client/data/queryKeys';
import { useCategoryMap } from 'client/data/SessionStore';

import { ColorPicker } from '../component/ColorPicker';
import { OptionalDatePicker } from '../component/OptionalDatePicker';
import { QueryBoundary } from '../component/QueryBoundary';
import { TagsPicker } from '../component/TagsPicker';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadImageButton';
import { DialogHeading, Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';
import styles from './GroupingEditor.module.css';
import { useGroupingState } from './GroupingEditorState';

interface GroupingDialogPayload {
  groupingId: ObjectId | null;
}

const useGroupingDialogStore = create<{
  payload: GroupingDialogPayload | null;
  setPayload: (payload: GroupingDialogPayload | null) => void;
}>(set => ({
  payload: null,
  setPayload: payload => set({ payload }),
}));

export function editExpenseGrouping(groupingId: ObjectId) {
  useGroupingDialogStore.getState().setPayload({ groupingId });
}

export function newExpenseGrouping() {
  useGroupingDialogStore.getState().setPayload({ groupingId: null });
}

const GroupingDialogImpl: React.FC<{
  groupingId: ObjectId | null;
  onClose: () => void;
  reloadAll: () => void;
}> = ({ groupingId, onClose, reloadAll }) => (
  <Modal opened={true} onClose={onClose} size="lg" title="">
    <QueryBoundary
      fallback={
        <Flex align="center" justify="center" p="xl">
          <Loader size={64} />
        </Flex>
      }
    >
      <GroupingDialogContent groupingId={groupingId} onClose={onClose} reloadAll={reloadAll} />
    </QueryBoundary>
  </Modal>
);

const GroupingDialogContent: React.FC<{
  groupingId: ObjectId | null;
  onClose: () => void;
  reloadAll: () => void;
}> = ({ groupingId, onClose, reloadAll }) => {
  if (groupingId === null) {
    return (
      <GroupingEditView data={null} onClose={onClose} reloadData={noop} reloadAll={reloadAll} />
    );
  }
  return <GroupingEditLoader groupingId={groupingId} onClose={onClose} reloadAll={reloadAll} />;
};

const GroupingEditLoader: React.FC<{
  groupingId: ObjectId;
  onClose: () => void;
  reloadAll: () => void;
}> = ({ groupingId, onClose, reloadAll }) => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.groupings.detail(groupingId),
    queryFn: () => apiConnect.getExpenseGrouping(groupingId),
  });
  const reloadData = React.useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: QueryKeys.groupings.detail(groupingId),
      }),
    [queryClient, groupingId],
  );
  return (
    <GroupingEditView data={data} onClose={onClose} reloadData={reloadData} reloadAll={reloadAll} />
  );
};

const GroupingEditView: React.FC<{
  data: ExpenseGrouping | null;
  onClose: () => void;
  reloadData: () => void;
  reloadAll: () => void;
}> = ({ data, onClose, reloadAll, reloadData }) => {
  const categoryMap = useCategoryMap()!;
  const createNew = data === null;
  const state = useGroupingState();
  const { data: tags } = useSuspenseQuery({
    queryKey: QueryKeys.groupings.tags,
    queryFn: () => apiConnect.getExpenseGroupingTags(),
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => void state.reset(data), [data?.id]);

  return (
    <>
      <DialogHeading>{createNew ? 'Uusi ryhmittely' : 'Muokkaa ryhmittelyä'}</DialogHeading>
      <Box className={styles.formGrid}>
        <SelectionRow title="Nimi">
          <TextEdit value={state.title} onChange={state.setTitle} />
        </SelectionRow>
        <SelectionRow title="Valinnat">
          <Stack gap="xs">
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
          </Stack>
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
            presetValues={tags}
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

export const GroupingEditor: React.FC<{ reloadAll: () => void }> = ({ reloadAll }) => {
  const payload = useGroupingDialogStore(s => s.payload);
  const onClose = React.useCallback(() => {
    useGroupingDialogStore.getState().setPayload(null);
  }, []);
  if (!payload) return null;
  return <GroupingDialogImpl {...payload} onClose={onClose} reloadAll={reloadAll} />;
};
