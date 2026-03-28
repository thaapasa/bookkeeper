import styled from '@emotion/styled';
import { ActionIcon } from '@mantine/core';
import * as React from 'react';

import { logger } from 'client/Logger';
import { KeyCodes } from 'client/util/Io';

import { TextEditorComponent } from '../dialog/DialogState';
import { Icons } from '../icons/Icons';
import { AutoCompleteProps } from './AutoComplete';
import { TextEdit, TextEditProps } from './TextEdit';

type EditorType<T> = TextEditorComponent | React.ComponentType<AutoCompleteProps<T>>;

export type ActivatableTextFieldProps<
  E extends EditorType<any> = React.ComponentType<TextEditProps>,
> = {
  editorId?: string;
  viewStyle?: React.CSSProperties;
  editorType?: React.ComponentType<E>;
  value: string;
  className?: string;
  onChange: (value: string) => void;
  onCancel?: () => void;
} & Omit<E, 'onChange' | 'value'>;

export const ActivatableTextField: React.FC<ActivatableTextFieldProps<any>> = <
  E extends EditorType<any>,
>({
  value: valueFromProps,
  onChange,
  onCancel,
  editorType,
  editorId,
  viewStyle,
  className,
  ...rest
}: ActivatableTextFieldProps<E>) => {
  const [edit, setEdit] = React.useState(false);
  const [value, setValue] = React.useState(valueFromProps);
  React.useEffect(() => setValue(valueFromProps), [setValue, valueFromProps]);

  const commit = (value: string) => {
    logger.info('Committing %s', value);
    onChange?.(value);
    setEdit(false);
  };

  const cancel = () => {
    logger.info('Cancelling');
    onCancel?.();
    setEdit(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    const code = event.keyCode;
    if (code === KeyCodes.enter) {
      commit(value);
      return false;
    } else if (code === KeyCodes.escape) {
      cancel();
      return false;
    }
    return;
  };

  const activate = () => {
    logger.info('Activating editor %s for %s', editorType, valueFromProps);
    setValue(valueFromProps);
    setEdit(true);
  };

  const Type = (editorType ?? TextEdit) as any;

  return edit ? (
    <EditorContainer>
      <Type
        autoFocus={true}
        variant="unstyled"
        styles={{ input: { fontSize: 'inherit' } }}
        {...rest}
        className={className}
        value={value}
        onChange={setValue}
        onKeyUp={handleKeyPress}
      />
      <ActionIcon size="sm" color="gray" onClick={cancel}>
        <Icons.CancelOutlined fontSize="medium" />
      </ActionIcon>
    </EditorContainer>
  ) : (
    <ValueContainer className={className} style={viewStyle} onClick={activate}>
      {value}
    </ValueContainer>
  );
};

const EditorContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.06));
  border-radius: var(--mantine-radius-sm);
  padding: 0 4px;
  & > div,
  & > svg {
    padding-right: 8px;
  }
`;

const ValueContainer = styled.div`
  cursor: pointer;
`;
