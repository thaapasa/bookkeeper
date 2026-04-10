import * as React from 'react';

import { logger } from 'client/Logger';

import { DialogConfig } from './Dialog';
import { useDialogStore } from './DialogState';
import { ModalDialog } from './ModalDialog';

export const ModalDialogConnector: React.FC = () => {
  const dialog = useDialogStore(s => s.config);

  const resolve = React.useCallback(
    <T,>(value: T | undefined) => {
      logger.debug(`Modal dialog resolved to: ${value}`);
      dialog?.resolve(value);
      useDialogStore.getState().setConfig(null);
    },
    [dialog],
  );

  if (!dialog) return null;

  logger.debug(`Rendering modal dialog of type ${dialog.type}: ${dialog.title}`);
  return <ModalDialog {...(dialog as DialogConfig<any, any>)} resolve={resolve} fullWidth />;
};
