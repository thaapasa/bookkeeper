import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as state from  '../data/state';
import { KeyCodes } from '../util/io'
import { unsubscribeAll } from '../util/client-util';
import { KeyboardEvent } from 'react';

const fields = {
    'title': { default: 'Title' },
    'content': { default: 'Content' },
    'actions': { default: [] },
    'resolve': { default: () => {} },
    'okAction': { default: undefined },
    'cancelAction': { default: undefined }
};

type Action = () => void;

interface Content<T> {
    title: string;
    content: string;
    actions: Action[];
    resolve: (result: T) => void;
    okAction?: Action;
    cancelAction?: Action;
};

interface DialogState {
    open: boolean;
    content: Content<any>;
};

const noContent: Content<{}> = {
    title: '',
    content: '',
    actions: [],
    resolve: (value: string) => {},
};

export default class ConfirmationDialog extends React.Component<{}, DialogState> {

    private unsub: any[] = [];
    public state: DialogState = {
        open: false,
        content: noContent,
    };

    private handleOpen = (dialogData: Content<any>) => {
        const newState = { open: true };
        if (dialogData) {
            Object.keys(fields).forEach(k => newState[k] = dialogData[k] ? dialogData[k] : fields[k].default);
        }
        this.setState(newState);
        return true;
    }

    private handleClose = () => {
        this.setState({ open: false, content: noContent });
        return true;
    }

    private handleKeyPress = (event: KeyboardEvent<any>) => {
        const code = event.keyCode;
        if (code === KeyCodes.enter) {
            return this.resolveWithIfDefined(true);
        } else if (code === KeyCodes.escape) {
            return this.resolveWithIfDefined(false);
        }
    }

    public componentDidMount() {
        this.unsub = [];
        this.unsub.push(state.get('confirmationDialogStream').onValue(d => this.handleOpen(d)));
    }

    public componentWillUnmount() {
        unsubscribeAll(this.unsub);
    }

    private resolveWithIfDefined = (value) => {
        if (this.state.content.actions.find(a => a[1] === value) !== undefined) {
            this.resolveWith(value);
            return false;
        }
    }

    private resolveWith = (value) => {
        Promise.resolve(this.state.content.resolve(value))
            .then(this.handleClose)
    }

    public render() {
        const actions = this.state.content.actions.map((a, i) => <FlatButton
            label={a[0]}
            primary={i === 0}
            tabIndex={i + 2}
            onKeyUp={this.handleKeyPress}
            onClick={() => this.resolveWith(a[1])}
        />);

        return <Dialog
            title={this.state.content.title}
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={() => this.resolveWithIfDefined(false)}>
            <div onKeyUp={this.handleKeyPress}>
                { this.state.content }
            </div>
        </Dialog>
    }
}
