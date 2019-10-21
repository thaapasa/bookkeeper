import * as React from 'react';
import {
  KeyboardDatePicker,
  MaterialUiPickersDate,
} from '@material-ui/pickers';
import { PickDateObject } from '../../data/StateTypes';
import { Action } from '../../../shared/types/Common';
import { pickDateE } from '../../data/State';
import { unsubscribeAll } from '../../util/ClientUtil';
import { datePickerFormat } from '../expense/dialog/DateField';

interface DatePickerProps {
  pick: PickDateObject;
  pickCounter: number;
}

interface DatePickerState {
  date?: Date;
}

class DatePickerComponent extends React.Component<
  DatePickerProps,
  DatePickerState
> {
  state: DatePickerState = { date: this.props.pick.initialDate };

  componentDidUpdate(prevProps: DatePickerProps) {
    if (prevProps.pick.initialDate !== this.props.pick.initialDate) {
      this.setState({ date: this.props.pick.initialDate });
    }
  }

  public render() {
    return (
      <KeyboardDatePicker
        variant="dialog"
        format={datePickerFormat}
        name="date-picker"
        value={this.state.date}
        onChange={this.onChange}
      />
    );
  }

  private onChange = (edited: MaterialUiPickersDate | null) => {
    const date = edited && edited.isValid() ? edited.toDate() : undefined;
    if (date) {
      this.setState({ date });
      this.props.pick.resolve(date);
    }
  };
}

interface DatePickerConnectorState {
  pick: PickDateObject | null;
  pickCounter: number;
}

let pickCounter = 0;

export default class DatePickerConnector extends React.Component<
  {},
  DatePickerConnectorState
> {
  public state: DatePickerConnectorState = { pick: null, pickCounter: 0 };
  private unsub: Action[] = [];

  public componentDidMount() {
    this.unsub.push(pickDateE.onValue(this.pickDate));
  }

  private pickDate = (pick: PickDateObject | null) => {
    pickCounter += 1;
    this.setState({ pick, pickCounter });
  };

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  public render() {
    return this.state.pick ? (
      <DatePickerComponent
        pick={this.state.pick}
        pickCounter={this.state.pickCounter}
      />
    ) : null;
  }
}
