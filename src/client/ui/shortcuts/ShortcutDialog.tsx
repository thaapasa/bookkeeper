import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { ObjectId } from 'shared/types';

import { connectDialog } from '../component/DialogConnector';

const shortcutBus = new B.Bus<{ shortcutId: ObjectId }>();

export function editShortcut(shortcutId: ObjectId) {
  shortcutBus.push({ shortcutId });
}

const ShortcutDialogImpl: React.FC<{ shortcutId: ObjectId; onClose: () => void }> = ({
  shortcutId,
  onClose,
}) => {
  return (
    <Dialog fullWidth={true} open={true} onClose={onClose}>
      <DialogTitle>Shortcut {shortcutId}</DialogTitle>
      <DialogContent>Moro</DialogContent>
    </Dialog>
  );
};

export const ShortcutDialog = connectDialog(shortcutBus, ShortcutDialogImpl);
