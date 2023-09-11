import { TextField, TextFieldProps } from '@mui/material';
import * as React from 'react';

import { AutoComplete, AutoCompleteProps } from './AutoComplete';

export const PlainTextField: React.FC<TextFieldProps> = props => (
  <TextField
    {...props}
    variant="standard"
    style={{ ...props.style, margin: 0, padding: 0 }}
    InputProps={{
      style: {
        margin: 0,
        padding: 0,
        fontSize: '11pt',
      },
    }}
  />
);

export const PlainAutoComplete: React.FC<AutoCompleteProps<any>> = props => (
  <AutoComplete {...props} label="" style={{ ...props.style, margin: 0, padding: 0, fontSize: '11pt' }} />
);
