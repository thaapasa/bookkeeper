import * as React from 'react';
import TextField from 'material-ui/TextField';
import { KeyCodes } from '../../util/Io';
import { CSSProperties } from 'react';
const debug = require('debug')('bookkeeper:activatable-text-field');

type EditorType = React.ComponentClass<any>;

interface ActivatableTextFieldProps {
  editorType?: EditorType;
  name?: string;
  style?: CSSProperties;
  value: string;
  id?: number;
  hintText?: string;
  onChange: (e: string) => void;
  onCancel?: () => void;
}

interface ActivatableTextFieldState {
  edit: boolean;
  value: string;
}

export default class ActivatableTextField extends React.Component<ActivatableTextFieldProps, ActivatableTextFieldState> {

  private editorRef: EditorType | null = null;

  public state: ActivatableTextFieldState;

  constructor(props: ActivatableTextFieldProps) {
    super(props);
    this.state = { edit: false, value: props.value };
  }
  private commit = (value: string) => {
    debug('Committing', value);
    this.props.onChange && this.props.onChange(value);
    this.close();
  }

  private cancel = () => {
    debug('Cancelling');
    if (this.props.onCancel) { this.props.onCancel(); }
    this.close();
  }

  private close = () => {
    this.setState({ value: this.props.value, edit: false });
  }

  private handleKeyPress = (event: KeyboardEvent) => {
    const code = event.keyCode;
    if (code === KeyCodes.enter) {
      this.commit(this.state.value);
      return false;
    } else if (code === KeyCodes.escape) {
      this.cancel();
      return false;
    }
    return;
  }

  private updateValue = (i: any, value: string) => this.setState({ value })

  private createEditor() {
    const type = this.props.editorType ? this.props.editorType : TextField;
    return React.createElement(type, {
      name: this.props.name,
      id: this.props.id,
      style: this.props.style,
      hintText: this.props.hintText,
      value: this.state.value,
      onChange: this.updateValue,
      // onBlur: i => this.commit(this.state.value),
      onKeyUp: this.handleKeyPress,
      ref: this.setRef,
    });
  }

  private activate = (i: any) => {
    debug('Activating editor', this.props.editorType, 'for', this.props.value);
    this.setState({ edit: true, value: this.props.value });
  }
  private setRef = (i: EditorType | null) => this.editorRef = i;
  private clearRef = (i: any) => this.editorRef = null;

  public render() {
    if (this.state.edit) { return this.createEditor(); }
    return (
      <div
        style={this.props.style}
        onClick={this.activate}
        ref={this.clearRef}
      >{this.props.value}</div>
    );
  }
}
