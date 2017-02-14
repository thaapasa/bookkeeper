import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as state from  "../data/state";
import {KeyCodes} from "../util/io"
import {unsubscribeAll} from "../util/client-util";

const fields = {
    "title": { default: "Title" },
    "content": { default: "Content" },
    "okText": { default: "Ok" },
    "cancelText": { default: "Cancel" },
    "resolve": { default: () => {} },
    "okAction": { default: undefined },
    "cancelAction": { default: undefined }
};

export default class ConfirmationDialog extends React.Component {

    constructor(props) {
        super(props);
        this.state = { open: false };
        Object.keys(fields).forEach(k => this.state[k] = fields[k].default);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleOpen(dialogData) {
        this.setState({ open: true });
        if (dialogData)
            Object.keys(fields).forEach(k => this.state[k] = dialogData[k] ? dialogData[k] : fields[k].default);
    }

    handleClose () {
        this.setState({ open: false });
        return true;
    }

    handleKeyPress(event) {
        const code = event.keyCode;
        if (code === KeyCodes.enter) {
            this.resolveWith(true);
            return false;
        } else if (code === KeyCodes.escape) {
            this.resolveWith(false);
            return false;
        }
    }

    componentDidMount() {
        this.unsub = [];
        this.unsub.push(state.get("confirmationDialogStream").onValue(d => this.handleOpen(d)));
    }

    componentWillUnmount() {
        unsubscribeAll(this.unsub);
    }

    resolveWith(value) {
        Promise.resolve(this.state.resolve(value))
            .then(this.handleClose)
    }

    render() {
        const actions = [
            <FlatButton
                label={this.state.cancelText}
                primary={true }
                onKeyUp={this.handleKeyPress}
                onTouchTap={() => this.resolveWith(false)}
            />,
            <FlatButton
                label={this.state.okText}
                primary={true}
                autoFocus={true}
                onKeyUp={this.handleKeyPress}
                onTouchTap={() => this.resolveWith(true)}
            />
        ];

        return <Dialog
            title={this.state.title}
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={() => this.resolveWith(false)}>
            <div onKeyUp={this.handleKeyPress}>
                { this.state.content }
            </div>
        </Dialog>
    }
}

ConfirmationDialog.propTypes = {};
