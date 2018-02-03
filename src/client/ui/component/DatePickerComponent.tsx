import * as React from 'react';
import * as state from '../../data/State'
import DatePicker from 'material-ui/DatePicker'
import * as moment from 'moment';
import { PickDateObject } from '../../data/StateTypes';
import { Action } from '../../../shared/types/Common';
import { pickDateE } from '../../data/State';
const debug = require('debug')('bookkeeper:date-picker');

interface DatePickerProps {
  pick: PickDateObject;
};

class DatePickerComponent extends React.Component<DatePickerProps, {}> {

  private datePicker: DatePicker | null = null;

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
    this.datePicker = ref;
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
};

export default class DatePickerConnector extends React.Component<{}, DatePickerConnectorState> {

  public state: DatePickerConnectorState = { pick: null };
  private unsubscribe: Action;

  public componentDidMount() {
    this.unsubscribe = pickDateE.onValue(pick => this.setState({ pick }));
  }

  public componentWillUnmount() {
    this.unsubscribe();
  }

  public render() {
    return this.state.pick ? <DatePickerComponent pick={this.state.pick} /> : null;
  }

}