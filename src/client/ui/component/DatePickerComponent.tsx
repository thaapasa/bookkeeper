import * as React from 'react';
import moment from 'moment';
import DatePicker from 'material-ui/DatePicker';
import { PickDateObject } from '../../data/StateTypes';
import { Action } from '../../../shared/types/Common';
import { pickDateE } from '../../data/State';
import { unsubscribeAll } from '../../util/ClientUtil';
const debug = require('debug')('bookkeeper:date-picker');

interface DatePickerProps {
  pick: PickDateObject;
}

class DatePickerComponent extends React.Component<DatePickerProps, {}> {

  private onChange = (_: any, d: Date) => {
    debug('Selecting date', d);
    this.props.pick.resolve(d);
  }
  private onDismiss = () => {
    debug('Dismissing date picker');
    this.props.pick.resolve(undefined);
  }
  private formatDate = (d: Date) => moment(d).format('D.M.YYYY');

  private setRef = (ref: DatePicker | null) => {
    if (ref) {
      debug('Opening dialog');
      ref.openDialog();
    }
  }

  public render() {
    return (
      <DatePicker
        textFieldStyle={{ display: 'none' }}
        formatDate={this.formatDate}
        name="date-picker"
        defaultDate={this.props.pick.initialDate}
        container="dialog"
        ref={this.setRef}
        autoOk={true}
        onChange={this.onChange}
        onDismiss={this.onDismiss}
      />
    );
  }
}

interface DatePickerConnectorState {
  pick: PickDateObject | null;
}

export default class DatePickerConnector extends React.Component<{}, DatePickerConnectorState> {

  public state: DatePickerConnectorState = { pick: null };
  private unsub: Action[] = [];

  public componentDidMount() {
    this.unsub.push(pickDateE.onValue(pick => this.setState({ pick })));
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  public render() {
    return this.state.pick ? <DatePickerComponent pick={this.state.pick} /> : null;
  }

}
