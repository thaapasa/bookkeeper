import { ActionIcon, Box, Button, Flex, Group, Loader, Modal } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as B from 'baconjs';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/expense';
import { ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';

import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadImageButton';
import { DialogHeading, Subtitle } from '../design/Text';
import { connectDialog } from '../dialog/DialogConnector';
import { ErrorView } from '../general/ErrorView';
import { Icons } from '../icons/Icons';
import { useShortcutState } from './ShortcutEditorState';
import { ShortcutLink } from './ShortcutLink';

const shortcutBus = new B.Bus<{ shortcutId: ObjectId }>();

export function editShortcut(shortcutId: ObjectId) {
  shortcutBus.push({ shortcutId });
}

const ShortcutDialogImpl: React.FC<{ shortcutId: ObjectId; onClose: () => void }> = ({
  shortcutId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: QueryKeys.shortcuts.detail(shortcutId),
    queryFn: () => apiConnect.getShortcut(shortcutId),
  });
  const reloadData = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: QueryKeys.shortcuts.detail(shortcutId) }),
    [queryClient, shortcutId],
  );
  return (
    <Modal opened={true} onClose={onClose} size="lg" title="">
      {isLoading ? (
        <Flex align="center" justify="center" p="xl">
          <Loader size={64} />
        </Flex>
      ) : error ? (
        <ErrorView title="Virhe tietojen latauksessa">{String(error)}</ErrorView>
      ) : data ? (
        <ShortcutEditView data={data} onClose={onClose} reloadData={reloadData} />
      ) : null}
    </Modal>
  );
};

const ShortcutEditView: React.FC<{
  data: ExpenseShortcut;
  onClose: () => void;
  reloadData: () => void;
}> = ({ data, onClose, reloadData }) => {
  const state = useShortcutState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => state.reset(data), [data.id]);

  return (
    <>
      <DialogHeading>Muokkaa linkkiä</DialogHeading>
      <Box
        display="grid"
        style={{
          gridTemplateColumns: 'auto 1fr',
          gap: 'var(--mantine-spacing-xs)',
          alignItems: 'center',
        }}
      >
        <Box>Nimi</Box>
        <Box>
          <TextEdit value={state.title} onChange={state.setTitle} />
        </Box>
        <Box>Taustaväri</Box>
        <Box>
          <TextEdit value={state.background} onChange={state.setBackground} width="80px" />
        </Box>
        <Box>Linkin kuva</Box>
        <Group gap="xs" wrap="nowrap">
          <ShortcutLink
            title={state.title}
            icon={data.icon}
            background={state.background}
            m={0}
            mr={4}
          />
          <Box flex={1} />
          <TextEdit value={state.margin} onChange={state.setMargin} width="40px" label="Reuna" />
          <UploadImageButton
            onSelect={(file, filename) => state.uploadShortcutIcon(file, filename).then(reloadData)}
            title="Lataa kuva"
          >
            <Icons.Upload />
          </UploadImageButton>
          <ActionIcon onClick={state.removeIcon} title="Poista kuva">
            <Icons.Delete />
          </ActionIcon>
        </Group>
        <Box style={{ gridColumn: '1 / -1' }}>
          <Subtitle>Linkin data</Subtitle>
        </Box>
        <Box style={{ gridColumn: '1 / -1' }}>
          <TextEdit value={state.expenseStr} onChange={state.setExpense} />
        </Box>

        <Box>
          <Button variant="subtle" onClick={onClose}>
            Peruuta
          </Button>
        </Box>
        <Box ta="right">
          <Button
            variant="filled"
            disabled={!state.inputValid()}
            onClick={() => state.saveShortcut(onClose)}
          >
            Tallenna
          </Button>
        </Box>
      </Box>
    </>
  );
};

export const ShortcutEditor = connectDialog(shortcutBus, ShortcutDialogImpl);
