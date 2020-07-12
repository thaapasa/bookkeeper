import * as React from 'react';
import { ConfirmationObject } from '../../data/StateTypes';
import { KeyCodes } from '../../util/Io';
import { confirmationE } from '../../data/State';
import { Action } from 'shared/types/Common';
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from '@material-ui/core';
import { AnyObject } from '../Types';

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
    return (
      <Dialog
        title={this.props.confirmation.title}
        open={true}
        onClose={() => this.resolveWithIfDefined(false)}
      >
        <DialogTitle>{this.props.confirmation.title}</DialogTitle>
        <DialogContent onKeyUp={this.handleKeyPress}>
          {this.props.confirmation.content}
        </DialogContent>
        <DialogActions>
          {this.props.confirmation.actions.map((a, i) => (
            <Button
              key={i}
              color={i === 0 ? 'primary' : 'default'}
              tabIndex={i + 2}
              onKeyUp={this.handleKeyPress}
              onClick={() => this.resolveWith(a.value)}
            >
              {a.label}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    );
  }
}

interface ConfirmationConnectDialogState {
  confirmation: ConfirmationObject<any> | null;
}

export default class ConfirmationConnectDialog extends React.Component<
  AnyObject,
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
