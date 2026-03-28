import { ActionIcon, Box, Button, Group, Modal } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { ExpenseShortcut } from 'shared/expense';
import { ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadImageButton';
import { DialogHeading, Subtitle } from '../design/Text';
import { connectDialog } from '../dialog/DialogConnector';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
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
  const { counter, forceReload } = useForceReload();
  const data = useAsyncData(getShortcut, true, shortcutId, counter);
  return (
    <Modal opened={true} onClose={onClose} size="lg" title="">
      <AsyncDataDialogContent
        data={data}
        renderer={ShortcutEditView}
        onClose={onClose}
        reloadData={forceReload}
      />
    </Modal>
  );
};

function getShortcut(shortcutId: ObjectId, _counter: number) {
  return apiConnect.getShortcut(shortcutId);
}

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
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 8,
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
            style={{ margin: 0, marginRight: 4 }}
          />
          <Box style={{ flex: 1 }} />
          <TextEdit value={state.margin} onChange={state.setMargin} width="40px" label="Reuna" />
          <UploadImageButton
            onSelect={(file, filename) => state.uploadShortcutIcon(file, filename).then(reloadData)}
            title="Lataa kuva"
          >
            <Icons.Upload />
          </UploadImageButton>
          <ActionIcon variant="subtle" onClick={state.removeIcon} title="Poista kuva">
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
        <Box style={{ textAlign: 'right' }}>
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
