"use strict";

import React from 'react';
import TextField from 'material-ui/TextField';
import {KeyCodes} from "../util/io";

export default class ActivatableTextField extends React.Component {

    constructor(props) {
        super(props);
        this.state = { edit: false, value: props.value };
        this.commit = this.commit.bind(this);
        this.cancel = this.cancel.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    commit(value) {
        // console.log("Committing", value);
        this.props.onChange && this.props.onChange(value);
        this.close();
    }

    cancel() {
        // console.log("Cancelling");
        this.props.onCancel && this.props.onCancel();
        this.close();
    }

    close() {
        this.setState({ value: this.props.value, edit: false });
    }

    handleKeyPress(event, value) {
        const code = event.keyCode;
        if (code === KeyCodes.enter) {
            this.commit(value);
            return false;
        } else if (code === KeyCodes.escape) {
            this.cancel();
            return false;
        }
    }

    componentDidUpdate() {
        if (this.editorRef) this.editorRef.focus();
    }

    createEditor() {
        const type = this.props.editorType ? this.props.editorType : TextField;
        return React.createElement(type, {
            name: this.props.name,
            id: this.props.id,
            hintText: this.props.hintText,
            value: this.state.value,
            onChange: i => this.setState({ value: i.target ? i.target.value : i }),
            // onBlur: i => this.commit(this.state.value),
            onKeyUp: event => this.handleKeyPress(event, this.state.value),
            ref: r => this.editorRef = r
        });
    }

    render() {
        return this.state.edit ? this.createEditor() :
            <div
                onClick={i => this.setState({ edit: true, value: this.props.value })}
                ref={i => this.editorRef = undefined}
            >{ this.props.value }</div>
    }
}

ActivatableTextField.propTypes = {
    editorType: React.PropTypes.func,
    value: React.PropTypes.string.isRequired,
    id: React.PropTypes.number,
    hintText: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func
};
