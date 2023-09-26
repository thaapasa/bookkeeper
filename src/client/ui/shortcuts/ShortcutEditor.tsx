import { Button, Dialog, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import * as B from 'baconjs';
import * as React from 'react';
import { create } from 'zustand';

import { ExpenseShortcutData, ExpenseShortcutPayload } from 'shared/expense';
import { ExpenseShortcut, ObjectId } from 'shared/types';
import { requireDefined } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { executeOperation } from 'client/util/ExecuteOperation';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connectDialog } from '../component/DialogConnector';
import { Row } from '../component/Row';
import { TextEdit } from '../component/TextEdit';
import { UploadImageButton } from '../component/UploadFileButton';
import { Subtitle } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { Flex } from '../Styles';
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
    <Dialog fullWidth={true} open={true} onClose={onClose}>
      <AsyncDataDialogContent
        data={data}
        renderer={ShortcutEditView}
        onClose={onClose}
        reloadData={forceReload}
      />
    </Dialog>
  );
};

function getShortcut(shortcutId: ObjectId, _counter: number) {
  return apiConnect.getShortcut(shortcutId);
}

export type ShortcutState = {
  title: string;
  background: string;
  expenseStr: string;
  setTitle: (title: string) => void;
  setBackground: (background: string) => void;
  setExpense: (expense: string) => void;
  reset: (shortcut: ExpenseShortcut) => void;
  inputValid: () => boolean;
  toPayload: () => ExpenseShortcutPayload;
  margin: string;
  setMargin: (margin: string) => void;
};

export const useShortcutState = create<ShortcutState>((set, get) => ({
  title: '',
  background: '',
  expenseStr: '',
  margin: '0',
  setTitle: title => set({ title }),
  setBackground: background => set({ background }),
  setExpense: expenseStr => set({ expenseStr }),
  setMargin: margin => set({ margin }),
  reset: shortcut =>
    set({
      title: shortcut.title,
      background: shortcut.background ?? '',
      expenseStr: JSON.stringify(shortcut.expense ?? {}, null, 2),
      margin: '0',
    }),
  inputValid: () => {
    const s = get();
    return !!s.title && parseExpense(s.expenseStr) !== undefined;
  },
  toPayload: () => {
    const s = get();
    return {
      title: s.title,
      background: s.background || undefined,
      expense: requireDefined(parseExpense(s.expenseStr), 'parsed expense data'),
    };
  },
}));

function parseExpense(expenseStr: string): ExpenseShortcutData | undefined {
  try {
    const d = JSON.parse(expenseStr);
    const parsed = ExpenseShortcutData.parse(d);
    return parsed;
  } catch (e) {
    return undefined;
  }
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
      <DialogTitle>Muokkaa linkkiä</DialogTitle>
      <DialogContent>
        <Grid container rowSpacing={1} justifyContent="space-between">
          <Grid item xs={4}>
            Nimi
          </Grid>
          <Grid item xs={8}>
            <TextEdit value={state.title} onChange={state.setTitle} fullWidth />
          </Grid>
          <Grid item xs={4}>
            Taustaväri
          </Grid>
          <Grid item xs={8}>
            <TextEdit value={state.background} onChange={state.setBackground} width="80px" />
          </Grid>
          <Grid item xs={4}>
            Linkin kuva
          </Grid>
          <Grid item xs={8}>
            <Row>
              <ShortcutIcon title={state.title} icon={data.icon} background={state.background} />
              <Flex />
              <TextEdit
                value={state.margin}
                onChange={state.setMargin}
                width="40px"
                label="Reuna"
              />
              <UploadImageButton
                onSelect={(file, filename) =>
                  uploadShortcutIcon(data.id, file, filename, state.margin).then(reloadData)
                }
                title="Lataa kuva"
              >
                <Icons.Upload />
              </UploadImageButton>
              <IconButton onClick={() => removeIcon(data.id)} title="Poista kuva">
                <Icons.Delete />
              </IconButton>
            </Row>
          </Grid>
          <Grid item xs={12}>
            <Subtitle>Linkin data</Subtitle>
          </Grid>
          <Grid item xs={12}>
            <TextEdit value={state.expenseStr} onChange={state.setExpense} multiline fullWidth />
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
              onClick={() => saveShortcut(data.id, state.toPayload(), onClose)}
            >
              Tallenna
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

const ShortcutIcon = styled(ShortcutLink)`
  margin: 0;
  margin-right: 4px;
`;

export const ShortcutEditor = connectDialog(shortcutBus, ShortcutDialogImpl);

async function saveShortcut(
  shortcutId: ObjectId,
  data: ExpenseShortcutPayload,
  onClose: () => void,
): Promise<void> {
  await executeOperation(() => apiConnect.updateShortcut(shortcutId, data), {
    postProcess: updateSession,
    success: 'Linkki päivitetty',
    throw: true,
  });
  onClose();
}

async function uploadShortcutIcon(
  shortcutId: ObjectId,
  file: File,
  filename: string,
  margin: string,
): Promise<ExpenseShortcut> {
  return await executeOperation(
    () => apiConnect.uploadShortcutIcon(shortcutId, file, filename, Number(margin)),
    {
      postProcess: updateSession,
      success: 'Ikoni päivitetty',
      throw: true,
    },
  );
}

async function removeIcon(shortcutId: ObjectId): Promise<void> {
  await executeOperation(() => apiConnect.removeShortcutIcon(shortcutId), {
    postProcess: updateSession,
    success: 'Ikoni poistettu',
  });
}
