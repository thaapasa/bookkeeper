import * as React from 'react';
import TextField from 'material-ui/TextField';
import AutoComplete from 'material-ui/AutoComplete';
import { AutoCompleteProps, TextFieldProps } from 'material-ui';

export class PlainTextField extends React.Component<TextFieldProps, {}> {
  private ref;
  private setRef = (r) => this.ref = r;
  public focus() {
    if (this.ref) { this.ref.focus(); }
  }
  public render() {
    return (
      <TextField {...this.props}
        ref={this.setRef}
        style={{ ...this.props.style, margin: 0, padding: 0 }}
        inputStyle={{ ...this.props.inputStyle, margin: 0, padding: 0, fontSize: '11pt' }} />
    );
  }
}

export class PlainAutoComplete<T> extends React.Component<AutoCompleteProps<T>, {}> {
  private ref;
  private setRef = (r) => this.ref = r;
  public focus() {
    if (this.ref) { this.ref.focus(); }
  }
  public render() {
    return (
      <AutoComplete {...this.props}
        floatingLabelText=""
        ref={this.setRef}
        style={{ ...this.props.style, margin: 0, padding: 0 }}
        inputStyle={{ ...this.props.inputStyle, padding: 0, margin: 0, fontSize: '11pt' }} />
    );
  }
}
