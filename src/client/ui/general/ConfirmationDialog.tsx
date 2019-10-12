import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { ConfirmationObject } from '../../data/StateTypes';
import { KeyCodes } from '../../util/Io';
import { confirmationE } from '../../data/State';
import { Action } from '../../../shared/types/Common';

interface ConfirmationDialogProps<T> {
  confirmation: ConfirmationObject<T>;
  onFinish: Action;
}

class ConfirmationDialog<T> extends React.Component<
  ConfirmationDialogProps<T>
> {
  private handleKeyPress = (event: React.KeyboardEvent<any>) => {
    const code = event.keyCode;
    if (code === KeyCodes.enter) {
      return this.resolveWithIfDefined(true);
    } else if (code === KeyCodes.escape) {
      return this.resolveWithIfDefined(false);
    }
    return;
  };

  private resolveWithIfDefined = (value: any) => {
    if (
      this.props.confirmation.actions.find(a => a.value === value) !== undefined
    ) {
      this.resolveWith(value);
      return false;
    }
    return;
  };

  private resolveWith = async (value: T) => {
    await this.props.confirmation.resolve(value);
    this.props.onFinish();
  };

  public render() {
    const actions = this.props.confirmation.actions.map((a, i) => (
      <FlatButton
        key={i}
        label={a.label}
        primary={i === 0}
        tabIndex={i + 2}
        onKeyUp={this.handleKeyPress}
        // tslint:disable-next-line jsx-no-lambda
        onClick={() => this.resolveWith(a.value)}
      />
    ));

    return (
      <Dialog
        title={this.props.confirmation.title}
        actions={actions}
        modal={false}
        open={true}
        // tslint:disable-next-line jsx-no-lambda
        onRequestClose={() => this.resolveWithIfDefined(false)}
      >
        <div onKeyUp={this.handleKeyPress}>
          {this.props.confirmation.content}
        </div>
      </Dialog>
    );
  }
}

interface ConfirmationConnectDialogState {
  confirmation: ConfirmationObject<any> | null;
}

export default class ConfirmationConnectDialog extends React.Component<
  {},
  ConfirmationConnectDialogState
> {
  private unsubscribe: Action | null = null;

  public state: ConfirmationConnectDialogState = { confirmation: null };

  public componentDidMount() {
    this.unsubscribe = confirmationE.onValue(confirmation =>
      this.setState({ confirmation })
    );
  }

  public componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private close = () => {
    this.setState({ confirmation: null });
  };

  public render() {
    return this.state.confirmation ? (
      <ConfirmationDialog
        confirmation={this.state.confirmation}
        onFinish={this.close}
      />
    ) : null;
  }
}
