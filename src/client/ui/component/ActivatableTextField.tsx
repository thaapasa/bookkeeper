import * as React from 'react';
import { KeyCodes } from '../../util/Io';
import debug from 'debug';
import { TextField } from '@material-ui/core';
import { TextFieldProps } from '@material-ui/core/TextField';
const log = debug('bookkeeper:activatable-text-field');

type EditorType = React.ComponentClass<TextFieldProps>;

interface ActivatableTextFieldProps {
  editorType?: EditorType;
  name?: string;
  style?: React.CSSProperties;
  value: string;
  id?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onCancel?: () => void;
}

interface ActivatableTextFieldState {
  edit: boolean;
  value: string;
}

export default class ActivatableTextField extends React.Component<
  ActivatableTextFieldProps,
  ActivatableTextFieldState
> {
  public state: ActivatableTextFieldState;

  constructor(props: ActivatableTextFieldProps) {
    super(props);
    this.state = { edit: false, value: props.value };
  }
  private commit = (value: string) => {
    log('Committing', value);
    if (this.props.onChange) {
      this.props.onChange(value);
    }
    this.close();
  };

  private cancel = () => {
    log('Cancelling');
    if (this.props.onCancel) {
      this.props.onCancel();
    }
    this.close();
  };

  private close = () => {
    this.setState({ value: this.props.value, edit: false });
  };

  private handleKeyPress = (event: React.KeyboardEvent) => {
    const code = event.keyCode;
    if (code === KeyCodes.enter) {
      this.commit(this.state.value);
      return false;
    } else if (code === KeyCodes.escape) {
      this.cancel();
      return false;
    }
    return;
  };

  private updateValue = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ value: event.target.value });

  private createEditor() {
    const Type = this.props.editorType ? this.props.editorType : TextField;
    return (
      <Type
        value={this.props.value}
        onChange={this.updateValue}
        name={this.props.name}
        id={this.props.id}
        style={this.props.style}
        placeholder={this.props.placeholder}
        onKeyUp={this.handleKeyPress}
      />
    );
  }

  private activate = () => {
    log('Activating editor', this.props.editorType, 'for', this.props.value);
    this.setState({ edit: true, value: this.props.value });
  };

  public render() {
    if (this.state.edit) {
      return this.createEditor();
    }
    return (
      <div style={this.props.style} onClick={this.activate}>
        {this.props.value}
      </div>
    );
  }
}
