import { TextField, TextFieldProps } from '@mui/material';
import * as React from 'react';

export const TextEdit: React.FC<
  Omit<TextFieldProps, 'onChange'> & { onChange: (s: string) => void }
> = ({ onChange, ...props }) => {
  const onChangeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      onChange(e.target.value),
    [onChange]
  );
  return <TextField {...props} onChange={onChangeHandler} />;
};
