import * as React from 'react';
import TextField from 'material-ui/TextField';
import {KeyCodes} from '../util/io';
import PropTypes from 'prop-types';
import { CSSProperties } from 'react';

interface ActivatableTextFieldProps {
    editorType?: any
    name?: string;
    style?: CSSProperties;
    value: string;
    id?: number;
    hintText?: string;
    onChange: (e: any) => void;
    onCancel?: () => void;
}

interface ActivatableTextFieldState {
    edit: boolean;
    value: string;
}

export default class ActivatableTextField extends React.Component<ActivatableTextFieldProps, ActivatableTextFieldState> {

    private editorRef: any;

    public state: ActivatableTextFieldState;

    constructor(props: ActivatableTextFieldProps) {
        super(props);
        this.state = { edit: false, value: props.value };
    }

    private commit = (value) => {
        // console.log("Committing", value);
        this.props.onChange && this.props.onChange(value);
        this.close();
    }

    private cancel = () => {
        // console.log("Cancelling");
        if (this.props.onCancel) { this.props.onCancel(); }
        this.close();
    }

    private close = () => {
        this.setState({ value: this.props.value, edit: false });
    }

    private handleKeyPress = (event, value) => {
        const code = event.keyCode;
        if (code === KeyCodes.enter) {
            this.commit(value);
            return false;
        } else if (code === KeyCodes.escape) {
            this.cancel();
            return false;
        }
    }

    public componentDidUpdate() {
        if (this.editorRef) this.editorRef.focus();
    }

    private createEditor() {
        const type = this.props.editorType ? this.props.editorType : TextField;
        return React.createElement(type, {
            name: this.props.name,
            id: this.props.id,
            style: this.props.style,
            hintText: this.props.hintText,
            value: this.state.value,
            onChange: i => this.setState({ value: i.target ? i.target.value : i }),
            // onBlur: i => this.commit(this.state.value),
            onKeyUp: event => this.handleKeyPress(event, this.state.value),
            ref: r => this.editorRef = r
        });
    }

    private onClick = i => this.setState({ edit: true, value: this.props.value });
    private setRef = i => this.editorRef = undefined;

    public render() {
        return this.state.edit ? this.createEditor() :
            <div
                style={this.props.style}
                onClick={this.onClick}
                ref={this.setRef}
            >{ this.props.value }</div>
    }
}
