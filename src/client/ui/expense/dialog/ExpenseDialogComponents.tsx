import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import * as React from 'react';

import {
  ExpenseType,
  expenseTypes,
  getExpenseTypeLabel,
} from 'shared/types/Expense';
import { Source } from 'shared/types/Session';
import { TextEdit } from 'client/ui/component/TextEdit';
import { ExpenseTypeIcon } from 'client/ui/Icons';
import { VCenterRow } from 'client/ui/Styles';

export function SumField(props: {
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}) {
  return (
    <TextEdit
      placeholder="0.00"
      label="Summa"
      InputLabelProps={{ shrink: true }}
      value={props.value}
      helperText={props.errorText || ' '}
      error={Boolean(props.errorText)}
      onChange={props.onChange}
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
    <TextEdit
      multiline={true}
      placeholder="Tarkempi selite"
      label="Selite"
      InputLabelProps={{ shrink: true }}
      fullWidth={true}
      helperText={props.errorText}
      error={Boolean(props.errorText)}
      value={props.value}
      onChange={props.onChange}
    />
  );
}
