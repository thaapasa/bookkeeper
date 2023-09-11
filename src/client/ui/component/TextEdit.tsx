import { styled, TextField, TextFieldProps } from '@mui/material';
import * as React from 'react';

export type TextEditProps = Omit<TextFieldProps, 'onChange'> & {
  onChange: (s: string) => void;
  width?: string;
};

export const TextEdit: React.FC<TextEditProps> = ({
  onChange,
  width,
  ...props
}) => {
  const onChangeHandler = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      onChange(e.target.value),
    [onChange]
  );
  return (
    <StyledField
      variant="standard"
      {...props}
      width={width}
      onChange={onChangeHandler}
    />
  );
};

// Disable LastPass icon (background image) on text fields
const StyledField = styled(TextField)`
  ${({ width }: { width?: string }) => (width ? `width: ${width};` : '')}
  & input {
    background-image: none !important;
  }
`;
