import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';

import * as state from  "../data/state";

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
      this.state = {
          open: false
      };
      Object.keys(fields).forEach(k => this.state[k] = fields[k].default);
      this.handleOpen = this.handleOpen.bind(this);
      this.handleClose = this.handleClose.bind(this);
  }

  handleOpen(dialogData) {
    this.setState({open: true});
    if (dialogData)
        Object.keys(fields).forEach(k => this.state[k] = dialogData[k] ? dialogData[k] : fields[k].default);
  };

  handleClose () {
    this.setState({open: false});
  };

  componentDidMount() {
      state.get("confirmationDialogStream").onValue(d => { this.handleOpen(d)});
  }

  resolveWith(value) {
    Promise.resolve(this.state.resolve(value))
        .then(this.handleClose)
  }

  render() {
    const actions = [
      <FlatButton
        label = { this.state.cancelText }
        primary = { true }
        onTouchTap = { () => this.resolveWith(false) }
      />,
      <FlatButton
        label = { this.state.okText }
        primary = { true }
        onTouchTap = { () => this.resolveWith(true) }
      />,
    ];

    return <Dialog
          title={this.state.title}
          actions={actions}
          modal={true}
          open={this.state.open}
        >
          {this.state.content}
        </Dialog>
  }
}

ConfirmationDialog.propTypes = {};
