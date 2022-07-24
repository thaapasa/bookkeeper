import { TextField, TextFieldProps } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

export const TextEdit: React.FC<
  Omit<TextFieldProps, 'onChange'> & { onChange: (s: string) => void }
> = ({ onChange, ...props }) => {
  const onChangeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      onChange(e.target.value),
    [onChange]
  );
  return (
    <StyledField variant="standard" {...props} onChange={onChangeHandler} />
  );
};

// Disable LastPass icon (background image) on text fields
const StyledField = styled(TextField)`
  & input {
    background-image: none !important;
  }
`;
