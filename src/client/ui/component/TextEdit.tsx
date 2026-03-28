import { TextInput, TextInputProps } from '@mantine/core';
import * as React from 'react';

export type TextEditProps = Omit<TextInputProps, 'onChange'> & {
  onChange: (s: string) => void;
  onSubmitEdit?: () => void;
  onCancelEdit?: () => void;
  width?: string;
};

export const TextEdit: React.FC<TextEditProps> = ({
  onChange,
  width,
  onSubmitEdit,
  onCancelEdit,
  onKeyUp,
  ...props
}) => {
  const onChangeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );
  const keyHandler = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSubmitEdit?.();
      } else if (e.key === 'Escape') {
        onCancelEdit?.();
      }
    },
    [onSubmitEdit, onCancelEdit],
  );

  return (
    <TextInput
      {...props}
      style={{ width, ...props.style }}
      onChange={onChangeHandler}
      onKeyUp={onKeyUp ?? keyHandler}
    />
  );
};
