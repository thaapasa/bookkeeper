import { Dialog, DialogTitle } from '@mui/material';
import * as React from 'react';

import { KeyCodes } from 'client/util/Io';

import { DialogConfig, DialogData } from './Dialog';

type ModalDialogProps<T, D extends DialogData> = DialogConfig<T, D>;

export const ModalDialog: React.FC<ModalDialogProps<any, any>> = <
  T,
  D extends DialogData
>({
  title,
  contentRenderer,
  resolve,
  enterResolution,
  rendererProps,
}: ModalDialogProps<T, D>) => {
  const handleKeyPress = React.useCallback(
    (event: React.KeyboardEvent<any>) => {
      const code = event.keyCode;
      if (code === KeyCodes.enter) {
        if (enterResolution) {
          resolve(enterResolution);
        }
      } else if (code === KeyCodes.escape) {
        resolve(undefined);
      }
      return;
    },
    [resolve, enterResolution]
  );

  const ContentRenderer = contentRenderer as any;

  const onCancel = React.useCallback(() => resolve(undefined), [resolve]);

  return (
    <Dialog
      title={title}
      open={true}
      onClose={() => onCancel}
      onKeyUp={handleKeyPress}
    >
      <DialogTitle>{title}</DialogTitle>
      <ContentRenderer
        onSelect={resolve}
        onCancel={onCancel}
        handleKeyPress={handleKeyPress}
        {...rendererProps}
      />
    </Dialog>
  );
};
