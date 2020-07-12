import * as React from 'react';
import { KeyboardDatePicker } from '@material-ui/pickers';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const datePickerFormat = 'DD.MM.YYYY';

export class DateField extends React.Component<DateFieldProps> {
  render() {
    return (
      <KeyboardDatePicker
        label="Päivämäärä"
        variant="dialog"
        format={datePickerFormat}
        value={this.props.value}
        onChange={this.onChange}
        autoOk={true}
      />
    );
  }

  private onChange = (date: any | null) => {
    if (date && date.isValid()) {
      this.props.onChange(date.toDate());
    }
  };
}
