import { DatePicker } from '@mui/x-date-pickers';
import * as React from 'react';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const datePickerFormat = 'DD.MM.YYYY';

export class DateField extends React.Component<DateFieldProps> {
  render() {
    return (
      <DatePicker
        label="Päivämäärä"
        inputFormat={datePickerFormat}
        value={this.props.value}
        onChange={this.onChange}
        renderInput={_i => <span>Moi</span>}
      />
    );
  }

  private onChange = (date: any | null) => {
    if (date && date.isValid()) {
      this.props.onChange(date.toDate());
    }
  };
}
