"use strict";

import React from 'react';
import TextField from 'material-ui/TextField';

const keyCodes = {
    enter: 13,
    escape: 27
};

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
        if (code === keyCodes.enter) {
            this.commit(value);
            return false;
        } else if (code === keyCodes.escape) {
            this.cancel();
            return false;
        }
    }

    componentDidUpdate() {
        if (this.editorRef) this.editorRef.focus();
    }

    render() {
        return this.state.edit ?
            <TextField
                name={this.props.name}
                id={this.props.id}
                hintText={this.props.hintText}
                value={this.state.value}
                onChange={i => this.setState({ value: i.target.value })}
                onBlur={i => this.commit(this.state.value)}
                onKeyUp={event => this.handleKeyPress(event, this.state.value)}
                ref={r => this.editorRef = r}
            /> :
            <div
                onClick={i => this.setState({ edit: true, value: this.props.value })}
                ref={i => this.editorRef = undefined}
            >{ this.props.value }</div>
    }
}
