import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@mui/material';
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
  expenseStr: string;
  setTitle: (title: string) => void;
  setBackground: (background: string) => void;
  setExpense: (expense: string) => void;
  reset: (shortcut: ExpenseShortcut) => void;
  inputValid: () => boolean;
  toPayload: () => ExpenseShortcutPayload;
};

export const useShortcutState = create<ShortcutState>((set, get) => ({
  title: '',
  background: '',
  expenseStr: '',
  setTitle: title => set({ title }),
  setBackground: background => set({ background }),
  setExpense: expenseStr => set({ expenseStr }),
  reset: shortcut =>
    set({
      title: shortcut.title,
      background: shortcut.background ?? '',
      expenseStr: JSON.stringify(shortcut.expense ?? {}, null, 2),
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
              onClick={() => saveShortcut(data.id, state.toPayload())}
            >
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

function saveShortcut(shortcutId: ObjectId, data: ExpenseShortcutPayload): Promise<void> {
  return executeOperation(() => apiConnect.updateShortcut(shortcutId, data), {
    postProcess: updateSession,
    success: 'Linkki päivitetty!',
  });
}
