import * as React from 'react';
import DatePicker from 'material-ui/DatePicker';
import { PickDateObject } from '../../data/StateTypes';
import { Action } from '../../../shared/types/Common';
import { pickDateE } from '../../data/State';
import { unsubscribeAll } from '../../util/ClientUtil';
import { toMoment } from '../../../shared/util/Time';
const debug = require('debug')('bookkeeper:date-picker');

interface DatePickerProps {
  pick: PickDateObject;
  pickCounter: number;
}

class DatePickerComponent extends React.Component<DatePickerProps, {}> {

  private ref: DatePicker | null = null;

  public componentDidMount() {
    this.open();
  }

  public componentDidUpdate(prevProps: DatePickerProps) {
    if (prevProps.pickCounter !== this.props.pickCounter) {
      this.open();
    }
  }

  private open = () => {
    if (this.ref) { this.ref.openDialog(); }
  }

  private onChange = (_: any, d: Date) => {
    debug('Selecting date', d);
    this.props.pick.resolve(d);
  }
  private onDismiss = () => {
    debug('Dismissing date picker');
    this.props.pick.resolve(undefined);
  }
  private formatDate = (d: Date) => toMoment(d).format('D.M.YYYY');

  private setRef = (ref: DatePicker | null) => this.ref = ref;

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
  pickCounter: number;
}

let pickCounter: number = 0;

export default class DatePickerConnector extends React.Component<{}, DatePickerConnectorState> {

  public state: DatePickerConnectorState = { pick: null, pickCounter: 0 };
  private unsub: Action[] = [];

  public componentDidMount() {
    this.unsub.push(pickDateE.onValue(this.pickDate));
  }

  private pickDate = (pick: PickDateObject | null) => {
    pickCounter += 1;
    this.setState({ pick, pickCounter });
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  public render() {
    return this.state.pick ? <DatePickerComponent pick={this.state.pick} pickCounter={this.state.pickCounter} /> : null;
  }

}
