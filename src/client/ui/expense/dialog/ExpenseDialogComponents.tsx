import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import * as React from 'react';

import {
  ExpenseType,
  expenseTypes,
  getExpenseTypeLabel,
} from 'shared/types/Expense';
import { Source } from 'shared/types/Session';

import { ExpenseTypeIcon } from '../../Icons';
import { VCenterRow } from '../../Styles';

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
      helperText={props.errorText || ' '}
      error={Boolean(props.errorText)}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        props.onChange(e.target.value)
      }
      autoFocus
    />
  );
}

export function SourceSelector(props: {
  value: number;
  onChange: (id: number) => void;
  sources: Source[];
  style?: React.CSSProperties;
  title: string;
}) {
  const id = 'expense-dialog-source';
  return (
    <FormControl fullWidth={true}>
      <InputLabel htmlFor={id} shrink={true}>
        {props.title}
      </InputLabel>
      <Select
        id={id}
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
    </FormControl>
  );
}

export class TypeSelector extends React.Component<{
  value: ExpenseType;
  onChange: (s: ExpenseType) => void;
}> {
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
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        props.onChange(e.target.value)
      }
    />
  );
}
