import debug from 'debug';
import * as React from 'react';
import styled from 'styled-components';

import { KeyCodes } from 'client/util/Io';

import { ReceiverFieldProps } from '../expense/dialog/ReceiverField';
import { AutoCompleteProps } from './AutoComplete';
import { TextEditProps } from './TextEdit';

const log = debug('bookkeeper:activatable-text-field');

type EditorType<T> =
  | React.ComponentType<TextEditProps>
  | React.ComponentType<AutoCompleteProps<T>>
  | React.ComponentType<ReceiverFieldProps>;

export type ActivatableTextFieldProps<E extends EditorType<any>> = {
  editorId?: string;
  viewStyle?: React.CSSProperties;
  editorType: React.ComponentType<E>;
  value: string;
  className?: string;
  onChange: (value: string) => void;
  onCancel?: () => void;
} & Omit<E, 'onChange' | 'value'>;

export const ActivatableTextField: React.FC<ActivatableTextFieldProps<any>> = <
  E extends EditorType<any>
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
    log('Committing', value);
    onChange?.(value);
    setEdit(false);
  };

  const cancel = () => {
    log('Cancelling');
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
    log('Activating editor', editorType, 'for', valueFromProps);
    setValue(valueFromProps);
    setEdit(true);
  };

  const Type = editorType as any;

  return edit ? (
    <Type
      className={className}
      autoFocus={true}
      value={value}
      onChange={setValue}
      onKeyUp={handleKeyPress}
      {...rest}
    />
  ) : (
    <ValueView className={className} style={viewStyle} onClick={activate}>
      {value}
    </ValueView>
  );
};

const ValueView = styled.div`
  cursor: pointer;
`;
