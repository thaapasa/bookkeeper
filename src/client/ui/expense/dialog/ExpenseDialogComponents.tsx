import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import {
  ExpenseType,
  expenseTypes,
  getExpenseTypeLabel,
} from 'shared/types/Expense';
import { Source } from 'shared/types/Session';
import Money, { sanitizeMoneyInput } from 'shared/util/Money';
import { TextEdit } from 'client/ui/component/TextEdit';
import { Add, ExpenseTypeIcon } from 'client/ui/Icons';
import { VCenterRow } from 'client/ui/Styles';

export function SumField(props: {
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}) {
  const addToSum = () => {
    const sum = window.prompt('Syötä summaan lisättävä määrä:');
    if (sum) {
      props.onChange(
        new Money(props.value || '0').plus(sanitizeMoneyInput(sum)).toString()
      );
    }
  };
  return (
    <SumArea>
      <TextEdit
        placeholder="0.00"
        label="Summa"
        name="sum"
        InputLabelProps={{ shrink: true }}
        value={props.value}
        helperText={props.errorText || ' '}
        error={Boolean(props.errorText)}
        onChange={props.onChange}
        type="text"
        autoFocus
        autoComplete="false"
      />
      <Add onClick={addToSum} />
    </SumArea>
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
    <FormControl fullWidth={true} variant="standard">
      <InputLabel htmlFor={id} shrink={true}>
        {props.title}
      </InputLabel>
      <Select
        labelId={id}
        value={props.value}
        style={props.style}
        label={props.title}
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

export const TypeSelector: React.FC<{
  value: ExpenseType;
  onChange: (s: ExpenseType) => void;
}> = ({ value, onChange }) => {
  const toggle = React.useCallback(() => {
    const toggled =
      expenseTypes[(expenseTypes.indexOf(value) + 1) % expenseTypes.length];
    if (toggled && onChange) {
      onChange(toggled);
    }
  }, [onChange, value]);

  return (
    <VCenterRow>
      <IconButton onClick={toggle}>
        <ExpenseTypeIcon type={value} size={24} />
      </IconButton>
      {getExpenseTypeLabel(value)}
    </VCenterRow>
  );
};

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

const SumArea = styled.div`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;
