import debug from 'debug';
import * as React from 'react';

import { DialogConfig } from './Dialog';
import { dialogActionE } from './DialogState';
import { ModalDialog } from './ModalDialog';

const log = debug('bookkeeper:modal-dialog');

export const ModalDialogConnector: React.FC = () => {
  const [dialog, setDialog] = React.useState<
    DialogConfig<any, any> | undefined
  >(undefined);

  React.useEffect(() => dialogActionE.onValue(setDialog), [setDialog]);

  const resolve = React.useCallback(
    <T,>(value: T | undefined) => {
      log(`Modal dialog resolved to: ${value}`);
      dialog?.resolve(value);
      setDialog(undefined);
    },
    [dialog, setDialog]
  );

  if (!dialog) return null;

  log(`Rendering modal dialog of type ${dialog.type}: ${dialog.title}`);
  return <ModalDialog {...dialog} resolve={resolve} />;
};
