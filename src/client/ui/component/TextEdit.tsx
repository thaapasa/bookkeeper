import { styled, TextField, TextFieldProps } from '@mui/material';
import * as React from 'react';

export type TextEditProps = Omit<TextFieldProps, 'onChange'> & {
  onChange: (s: string) => void;
  onSubmitEdit?: () => void;
  onCancelEdit?: () => void;
  width?: string;
};

type TextEditorType = HTMLTextAreaElement | HTMLInputElement;
export const TextEdit: React.FC<TextEditProps> = ({
  onChange,
  width,
  onSubmitEdit,
  onCancelEdit,
  onKeyUp,
  ...props
}) => {
  const onChangeHandler = React.useCallback(
    (e: React.ChangeEvent<TextEditorType>) => onChange(e.target.value),
    [onChange],
  );
  const keyHandler = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        onSubmitEdit?.();
      } else if (e.key === 'Escape') {
        onCancelEdit?.();
      }
    },
    [onSubmitEdit, onCancelEdit],
  );

  return (
    <StyledField
      variant="standard"
      {...props}
      width={width}
      onChange={onChangeHandler}
      onKeyUp={onKeyUp ?? keyHandler}
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
