import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as state from  "../data/state";
import {KeyCodes} from "../util/io"
import {unsubscribeAll} from "../util/client-util";

const fields = {
    "title": { default: "Title" },
    "content": { default: "Content" },
    "actions": { default: [] },
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
        this.resolveWithIfDefined = this.resolveWithIfDefined.bind(this);
        this.resolveWith = this.resolveWith.bind(this);
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
            return this.resolveWithIfDefined(true);
        } else if (code === KeyCodes.escape) {
            return this.resolveWithIfDefined(false);
        }
    }

    componentDidMount() {
        this.unsub = [];
        this.unsub.push(state.get("confirmationDialogStream").onValue(d => this.handleOpen(d)));
    }

    componentWillUnmount() {
        unsubscribeAll(this.unsub);
    }

    resolveWithIfDefined(value) {
        if (this.state.actions.find(a => a[1] === value) !== undefined) {
            this.resolveWith(value);
            return false;
        }
    }

    resolveWith(value) {
        Promise.resolve(this.state.resolve(value))
            .then(this.handleClose)
    }

    render() {
        const actions = this.state.actions.map((a, i) => <FlatButton
            label={a[0]}
            primary={i === 0}
            tabIndex={i + 2}
            onKeyUp={this.handleKeyPress}
            onTouchTap={() => this.resolveWith(a[1])}
        />);

        return <Dialog
            title={this.state.title}
            actions={actions}
            modal={false}
            open={this.state.open}
            tabIndex={1}
            onRequestClose={() => this.resolveWithIfDefined(false)}>
            <div onKeyUp={this.handleKeyPress}>
                { this.state.content }
            </div>
        </Dialog>
    }
}

ConfirmationDialog.propTypes = {};
