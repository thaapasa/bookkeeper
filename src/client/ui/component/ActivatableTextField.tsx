import { TextFieldProps } from '@mui/material/TextField';
import debug from 'debug';
import * as React from 'react';

import { omit } from 'shared/util/Objects';
import { eventValue } from 'client/util/ClientUtil';
import { KeyCodes } from 'client/util/Io';

import { ReceiverFieldProps } from '../expense/dialog/ReceiverField';
import { AutoCompleteProps } from './AutoComplete';

const log = debug('bookkeeper:activatable-text-field');

type EditorType<T> =
  | React.ComponentType<TextFieldProps>
  | React.ComponentType<AutoCompleteProps<T>>
  | React.ComponentType<ReceiverFieldProps>;

export type ActivatableTextFieldProps<T> = {
  editorId?: string;
  editorType: EditorType<T>;
  viewStyle?: React.CSSProperties;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onCancel?: () => void;
};

interface ActivatableTextFieldState {
  edit: boolean;
  value: string;
}

export default class ActivatableTextField<T> extends React.Component<
  ActivatableTextFieldProps<T>,
  ActivatableTextFieldState
> {
  public state: ActivatableTextFieldState;

  constructor(props: ActivatableTextFieldProps<T>) {
    super(props);
    this.state = { edit: false, value: props.value };
  }

  componentDidUpdate(prevProps: ActivatableTextFieldProps<T>) {
    if (this.props.value !== prevProps.value) {
      this.setState({ value: this.props.value });
    }
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
    this.setState({ value: eventValue(event) });

  private createEditor() {
    const Type: EditorType<T> = this.props.editorType;
    const childProps = omit(
      ['editorType', 'editorId', 'onChange', 'viewStyle'],
      this.props
    );
    return (
      <Type
        {...(childProps as any)}
        id={this.props.editorId}
        autoFocus={true}
        value={this.state.value}
        onChange={this.updateValue}
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
    } else {
      return (
        <div style={this.props.viewStyle} onClick={this.activate}>
          {this.props.value}
        </div>
      );
    }
  }
}
