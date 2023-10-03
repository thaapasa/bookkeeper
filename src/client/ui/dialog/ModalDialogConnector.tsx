import * as React from 'react';

import { logger } from 'client/Logger';

import { DialogConfig } from './Dialog';
import { dialogActionE } from './DialogState';
import { ModalDialog } from './ModalDialog';

export const ModalDialogConnector: React.FC = () => {
  const [dialog, setDialog] = React.useState<DialogConfig<any, any> | undefined>(undefined);

  React.useEffect(() => dialogActionE.onValue(setDialog), [setDialog]);

  const resolve = React.useCallback(
    <T,>(value: T | undefined) => {
      logger.debug(`Modal dialog resolved to: ${value}`);
      dialog?.resolve(value);
      setDialog(undefined);
    },
    [dialog, setDialog],
  );

  if (!dialog) return null;

  logger.debug(`Rendering modal dialog of type ${dialog.type}: ${dialog.title}`);
  return <ModalDialog {...dialog} resolve={resolve} fullWidth />;
};
