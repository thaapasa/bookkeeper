import { Alert } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import * as React from 'react';

import { Action, AnyObject, Timeout, toReadableErrorMessage } from 'shared/types';
import { notificationE } from 'client/data/State';
import { Notification } from 'client/data/StateTypes';
import { logger } from 'client/Logger';
import { unsubscribeAll } from 'client/util/ClientUtil';

const msgInterval = 5000;

interface NotificationBarProps {
  notification: Notification;
  onClose: Action;
}

const NotificationBarView: React.FC<NotificationBarProps> = ({ notification, onClose }) => {
  const message = notification.cause
    ? notification.message + ', syy: ' + toReadableErrorMessage(notification.cause)
    : notification.message;

  return (
    <Snackbar open={true} onClose={onClose}>
      <Alert severity={notification.severity ?? 'success'}>{message}</Alert>
    </Snackbar>
  );
};

interface NotificationBarConnectorState {
  notification: Notification | null;
}

export class NotificationBar extends React.Component<AnyObject, NotificationBarConnectorState> {
  private timer: Timeout | undefined;
  private queue: Notification[] = [];
  private unsub: Action[] = [];
  public state: NotificationBarConnectorState = {
    notification: null,
  };

  public componentDidMount() {
    this.unsub.push(notificationE.onValue(this.showMessage));
  }

  public componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = undefined;
    unsubscribeAll(this.unsub);
  }

  private showMessage = (notification: Notification) => {
    if (notification.severity === 'error') {
      logger.error(notification.cause ?? {}, notification.message);
    } else if (notification.severity === 'warning') {
      logger.warn(notification.cause ?? {}, notification.message);
    }
    this.queue.push(notification);
    if (!this.timer || notification.immediate) {
      this.scheduleNext();
    }
  };

  private scheduleNext = () => {
    this.timer = undefined;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.setState({ notification: next || null });
      this.timer = setTimeout(this.scheduleNext, msgInterval);
    } else {
      this.setState({ notification: null });
    }
  };

  private dismissCurrent = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.scheduleNext();
  };

  public render() {
    return this.state.notification ? (
      <NotificationBarView notification={this.state.notification} onClose={this.dismissCurrent} />
    ) : null;
  }
}
