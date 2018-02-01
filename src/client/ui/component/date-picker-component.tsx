import * as React from 'react';
import * as state from '../../data/State'
import DatePicker from 'material-ui/DatePicker'
import * as moment from 'moment';

interface DatePickerState {
    open: boolean;
    date?: Date;
    resolve?: (value: Date | undefined) => void;
    reject?: any;
};

export default class DatePickerComponent extends React.Component<{}, DatePickerState> {

    private unsub?: () => any;
    private datePicker: DatePicker | null = null;

    public state: DatePickerState = {
        open: false,
    };

    public componentDidMount() {
        this.unsub = state.get('pickDateStream').onValue(v => {
            this.setState(v, () => this.datePicker && this.datePicker.openDialog());
        });
    }

    public componentWillUnmount() {
        this.unsub && this.unsub();
        this.unsub = undefined;
    }

    private onChange = (_: any, d: Date) => this.state.resolve && this.state.resolve(d);
    private onDismiss = () => this.state.resolve && this.state.resolve(undefined);
    private formatDate = (d: Date) => moment(d).format('D.M.YYYY');

    private setRef = (ref: DatePicker | null) => { this.datePicker = ref; }

    public render() {
        return <DatePicker
            textFieldStyle={{ display: 'none' }}
            formatDate={this.formatDate}
            name="date-picker"
            defaultDate={this.state.date}
            value={this.state.date}
            container="dialog"
            ref={this.setRef}
            autoOk={true}
            onChange={this.onChange}
            onDismiss={this.onDismiss}
        />

    }
}
