import * as React from 'react';
import * as state from '../data/state'
import DatePicker from 'material-ui/DatePicker'
const moment = require('moment')

interface DatePickerState {
    open: boolean;
    date?: Date;
    resolve?: any;
    reject?: any;
};

export default class DatePickerComponent extends React.Component<{}, DatePickerState> {

    private unsub?: () => any;
    private datePicker?: any;

    public state: DatePickerState = {
        open: false,
    };

    public componentDidMount() {
        this.unsub = state.get('pickDateStream').onValue(v => {
            this.setState(v, () => this.datePicker.openDialog());
        });
    }

    public componentWillUnmount() {
        this.unsub && this.unsub();
        this.unsub = undefined;
    }

    private onChange = (n, d: Date) => this.state.resolve && this.state.resolve(d);
    private onDismiss = () => this.state.resolve && this.state.resolve();
    private formatDate = (d: Date) => moment(d).format('D.M.YYYY');

    public render() {
        return <DatePicker
            textFieldStyle={{ display: 'none' }}
            formatDate={this.formatDate}
            name="date-picker"
            defaultDate={this.state.date}
            value={this.state.date}
            container="dialog"
            ref={r => this.datePicker = r}
            autoOk={true}
            onChange={this.onChange}
            onDismiss={this.onDismiss}
        />

    }
}
