import { ActionIcon, Box } from '@mantine/core';
import * as React from 'react';

import { logger } from 'client/Logger';
import { classNames } from 'client/ui/utils/classNames.ts';

import { TextEditorComponent } from '../dialog/DialogState';
import { Icons } from '../icons/Icons';
import styles from './ActivatableTextField.module.css';
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
    setValue(valueFromProps);
    onCancel?.();
    setEdit(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      commit(value);
      return false;
    } else if (event.key === 'Escape') {
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
    <Box className={styles.editorContainer}>
      <Type
        autoFocus={true}
        variant="unstyled"
        styles={{ input: { fontSize: 'inherit' } }}
        {...rest}
        className={className}
        value={value}
        onChange={setValue}
        onKeyDown={handleKeyPress}
      />
      <ActionIcon size="sm" color="gray" onClick={cancel}>
        <Icons.CancelOutlined fontSize="medium" />
      </ActionIcon>
    </Box>
  ) : (
    <Box
      className={classNames(styles.valueContainer, className)}
      style={viewStyle}
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
    >
      {value}
    </Box>
  );
};
