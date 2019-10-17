import * as React from 'react';
import { ExpenseTypeIcon } from '../Icons';
import { Source } from '../../../shared/types/Session';
import {
  ExpenseType,
  getExpenseTypeLabel,
  expenseTypes,
} from '../../../shared/types/Expense';
import { VCenterRow } from '../Styles';
import { TextField, MenuItem, Select, IconButton } from '@material-ui/core';

// tslint:disable jsx-no-lambda
export function SumField(props: {
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}) {
  return (
    <TextField
      placeholder="0.00"
      label="Summa"
      InputLabelProps={{ shrink: true }}
      value={props.value}
      helperText={props.errorText}
      error={Boolean(props.errorText)}
      onChange={e => props.onChange(e.target.value)}
    />
  );
}

export function SourceSelector(props: {
  value: number;
  onChange: (id: number) => void;
  sources: Source[];
  style?: React.CSSProperties;
}) {
  return (
    <Select
      value={props.value}
      style={props.style}
      onChange={e => props.onChange(Number(e.target.value))}
    >
      {props.sources.map(s => (
        <MenuItem key={s.id} value={s.id}>
          {s.name}
        </MenuItem>
      ))}
    </Select>
  );
}

export class TypeSelector extends React.Component<
  {
    value: ExpenseType;
    onChange: (s: ExpenseType) => void;
  },
  {}
> {
  private toggle = () => {
    const toggled =
      expenseTypes[
        (expenseTypes.indexOf(this.props.value) + 1) % expenseTypes.length
      ];
    if (toggled && this.props.onChange) {
      this.props.onChange(toggled);
    }
  };
  public render() {
    return (
      <VCenterRow>
        <IconButton onClick={this.toggle}>
          <ExpenseTypeIcon type={this.props.value} size={24} />
        </IconButton>
        {getExpenseTypeLabel(this.props.value)}
      </VCenterRow>
    );
  }
}

export function DescriptionField(props: {
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}) {
  return (
    <TextField
      multiline={true}
      placeholder="Tarkempi selite"
      label="Selite"
      InputLabelProps={{ shrink: true }}
      fullWidth={true}
      helperText={props.errorText}
      error={Boolean(props.errorText)}
      value={props.value}
      onChange={e => props.onChange(e.target.value)}
    />
  );
}
