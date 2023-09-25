import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';
import { create } from 'zustand';

import { ExpenseShortcut, ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connectDialog } from '../component/DialogConnector';
import { TextEdit } from '../component/TextEdit';
import { Subtitle } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';

const shortcutBus = new B.Bus<{ shortcutId: ObjectId }>();

export function editShortcut(shortcutId: ObjectId) {
  shortcutBus.push({ shortcutId });
}

const ShortcutDialogImpl: React.FC<{ shortcutId: ObjectId; onClose: () => void }> = ({
  shortcutId,
  onClose,
}) => {
  const data = useAsyncData(getShortcut, true, shortcutId);
  return (
    <Dialog fullWidth={true} open={true} onClose={onClose}>
      <AsyncDataDialogContent data={data} renderer={ShortcutEditView} onClose={onClose} />
    </Dialog>
  );
};

export type ShortcutState = {
  title: string;
  background: string;
  expense: string;
  setTitle: (title: string) => void;
  setBackground: (background: string) => void;
  setExpense: (expense: string) => void;
  reset: (shortcut: ExpenseShortcut) => void;
};

export const useShortcutState = create<ShortcutState>(set => ({
  title: '',
  background: '',
  expense: '',
  setTitle: title => set({ title }),
  setBackground: background => set({ background }),
  setExpense: expense => set({ expense }),
  reset: shortcut =>
    set({
      title: shortcut.title,
      background: shortcut.background ?? '',
      expense: JSON.stringify(shortcut.expense ?? {}, null, 2),
    }),
}));

const ShortcutEditView: React.FC<{ data: ExpenseShortcut; onClose: () => void }> = ({
  data,
  onClose,
}) => {
  const state = useShortcutState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => state.reset(data), [data]);

  return (
    <>
      <DialogTitle>Muokkaa linkkiä</DialogTitle>
      <DialogContent>
        <Grid container rowSpacing={1} justifyContent="space-between">
          <Grid item xs={4}>
            Nimi
          </Grid>
          <Grid item xs={8}>
            <TextEdit value={state.title} onChange={state.setTitle} />
          </Grid>
          <Grid item xs={4}>
            Taustaväri
          </Grid>
          <Grid item xs={8}>
            <TextEdit value={state.background} onChange={state.setBackground} />
          </Grid>
          <Grid item xs={12}>
            <Subtitle>Linkin data</Subtitle>
          </Grid>
          <Grid item xs={12}>
            <TextEdit value={state.expense} onChange={state.setExpense} multiline fullWidth />
          </Grid>
          <Grid item xs="auto">
            <Button color="inherit" onClick={onClose}>
              Peruuta
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button color="primary" variant="contained">
              Tallenna
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

export const ShortcutEditor = connectDialog(shortcutBus, ShortcutDialogImpl);

function getShortcut(shortcutId: ObjectId): Promise<ExpenseShortcut> {
  return apiConnect.getShortcut(shortcutId);
}
