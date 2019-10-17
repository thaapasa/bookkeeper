import * as React from 'react';
import { TextField } from '@material-ui/core';
import { TextFieldProps } from '@material-ui/core/TextField';
import AutoComplete, { AutoCompleteProps } from './AutoComplete';

export class PlainTextField extends React.Component<TextFieldProps, {}> {
  public render() {
    return (
      <TextField
        {...this.props}
        variant="standard"
        style={{ ...this.props.style, margin: 0, padding: 0 }}
        InputProps={{
          style: {
            margin: 0,
            padding: 0,
            fontSize: '11pt',
          },
        }}
      />
    );
  }
}

export class PlainAutoComplete<T> extends React.Component<
  AutoCompleteProps<T>,
  {}
> {
  public render() {
    return (
      <AutoComplete
        {...this.props}
        label=""
        style={{ ...this.props.style, margin: 0, padding: 0, fontSize: '11pt' }}
      />
    );
  }
}
