import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { styled } from '@mui/material';
import debug from 'debug';
import * as React from 'react';

import { KeyCodes } from 'client/util/Io';

import { AutoCompleteProps } from './AutoComplete';
import { TextEdit, TextEditProps } from './TextEdit';
import { TextEditorComponent } from './TextEditVariants';

const log = debug('bookkeeper:activatable-text-field');

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

  const Type = (editorType ?? TextEdit) as any;

  return edit ? (
    <EditorContainer>
      <Type
        autoFocus={true}
        {...rest}
        className={className}
        value={value}
        onChange={setValue}
        onKeyUp={handleKeyPress}
      />
      <CancelOutlinedIcon color="action" onClick={cancel} fontSize="small" />
    </EditorContainer>
  ) : (
    <ValueContainer className={className} style={viewStyle} onClick={activate}>
      {value}
    </ValueContainer>
  );
};

const EditorContainer = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > div,
  & > svg {
    padding-right: 8px;
  }
`;

const ValueContainer = styled('div')`
  cursor: pointer;
`;
