import * as React from 'react';
import Snackbar from 'material-ui/Snackbar';
import { Notification } from '../../data/StateTypes';
import { notificationE } from '../../data/State';
import { Action } from '../../../shared/types/Common';

const msgInterval = 5000;

interface NotificationBarProps {
  notification: Notification;
  onClose: Action;
}

class NotificationBar extends React.Component<NotificationBarProps, {}> {
  private getMessage() {
    return this.props.notification.cause ?
      this.props.notification.message + ', cause: ' + this.props.notification.message :
      this.props.notification.message;
  }
  public render() {
    return (
      <Snackbar
        open={true}
        message={this.getMessage()}
        onRequestClose={this.props.onClose} />
    );
  }
}

interface NotificationBarConnectorState {
  notification: Notification | null;
}

export default class NotificationBarConnector extends React.Component<{}, NotificationBarConnectorState> {

  private timer: NodeJS.Timer | undefined;
  private queue: Notification[] = [];
  private unsubscribe: Action;
  public state: NotificationBarConnectorState = {
    notification: null,
  };

  public componentDidMount() {
    this.unsubscribe = notificationE.onValue(this.showMessage);
  }

  public componentWillUnmount() {
    if (this.timer) { clearTimeout(this.timer); }
    this.timer = undefined;
    this.unsubscribe();
  }

  private showMessage = (notification: Notification) => {
    this.queue.push(notification);
    if (!this.timer) {
      this.scheduleNext();
    }
  }

  private scheduleNext = () => {
    this.timer = undefined;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.setState({ notification: next || null });
      this.timer = setTimeout(this.scheduleNext, msgInterval);
    } else {
      this.setState({ notification: null });
    }
  }

  private dismissCurrent = () => {
    if (this.timer) { clearTimeout(this.timer); }
    this.scheduleNext();
  }

  public render() {
    return this.state.notification ?
      <NotificationBar notification={this.state.notification} onClose={this.dismissCurrent} /> :
      null;
  }
}
