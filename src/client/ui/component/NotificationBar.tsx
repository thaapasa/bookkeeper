import * as React from 'react';
import Snackbar from 'material-ui/Snackbar';
import * as state from '../../data/State'

const msgInterval = 5000;

interface NotificationBarState {
  open: boolean;
  message: string;
}

export default class NotificationBar extends React.Component<{}, NotificationBarState> {

  private timer: any;
  private queue: any[] = [];
  public state: NotificationBarState = {
    open: false,
    message: '',
  };

  public componentDidMount() {
    state.get('notificationStream').onValue(msg => this.showMessage(msg));
  }

  public componentWillUnmount() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private showMessage = (msg) => {
    this.queue.push({ text: msg });
    if (this.timer === undefined) {
      this.scheduleNext();
    }
  }

  private scheduleNext = () => {
    this.timer = undefined;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.setState({ open: true, message: next.text });
      this.timer = setTimeout(this.scheduleNext, msgInterval);
    } else {
      this.setState({ open: false });
    }
  }

  private dismissCurrent = () => {
    clearTimeout(this.timer);
    this.scheduleNext();
  }

  public render() {
    return <Snackbar
      open={this.state.open}
      message={this.state.message}
      onRequestClose={this.dismissCurrent}
    />
  }
}

