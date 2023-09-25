import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { ExpenseShortcut, ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';

import { AsyncDataDialogContent } from '../component/AsyncDataDialog';
import { connectDialog } from '../component/DialogConnector';
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
      <AsyncDataDialogContent data={data} renderer={ShortcutEditView} />
    </Dialog>
  );
};

const ShortcutEditView: React.FC<{ data: ExpenseShortcut }> = ({ data }) => (
  <>
    <DialogTitle>Muokkaa linkkiä</DialogTitle>
    <DialogContent>Otsake {data.title}</DialogContent>
  </>
);

export const ShortcutEditor = connectDialog(shortcutBus, ShortcutDialogImpl);

function getShortcut(shortcutId: ObjectId): Promise<ExpenseShortcut> {
  return apiConnect.getShortcut(shortcutId);
}
