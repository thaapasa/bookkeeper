import { Modal } from '@mantine/core';
import * as React from 'react';

import { DialogConfig, DialogData } from './Dialog';

type ModalDialogProps<T, D extends DialogData> = DialogConfig<T, D> & {
  fullWidth?: boolean;
};

export const ModalDialog: React.FC<ModalDialogProps<any, any>> = <T, D extends DialogData>({
  title,
  contentRenderer,
  resolve,
  enterResolution,
  rendererProps,
}: ModalDialogProps<T, D>) => {
  const handleKeyPress = React.useCallback(
    (event: React.KeyboardEvent<any>) => {
      if (event.key === 'Enter') {
        if (enterResolution) {
          resolve(enterResolution);
        }
      } else if (event.key === 'Escape') {
        resolve(undefined);
      }
    },
    [resolve, enterResolution],
  );

  const ContentRenderer = contentRenderer as any;

  const onCancel = React.useCallback(() => resolve(undefined), [resolve]);

  return (
    <Modal opened={true} onClose={onCancel} title={title} onKeyUp={handleKeyPress} size="lg">
      <ContentRenderer
        onSelect={resolve}
        onCancel={onCancel}
        handleKeyPress={handleKeyPress}
        {...rendererProps}
      />
    </Modal>
  );
};
