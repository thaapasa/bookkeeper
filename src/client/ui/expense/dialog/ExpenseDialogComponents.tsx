import {
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  styled,
} from '@mui/material';
import * as React from 'react';

import { ExpenseType, expenseTypes, getExpenseTypeLabel } from 'shared/expense';
import { Source } from 'shared/types';
import { Money, sanitizeMoneyInput } from 'shared/util';
import { TextEdit } from 'client/ui/component/TextEdit';
import { ExpenseTypeIcon } from 'client/ui/icons/ExpenseType';
import { Icons } from 'client/ui/icons/Icons';
import { VCenterRow } from 'client/ui/Styles';

export const SumField: React.FC<{
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}> = ({ value, onChange, errorText }) => {
  const addToSum = () => {
    const sum = window.prompt('Syötä summaan lisättävä määrä:');
    if (sum) {
      onChange(
        new Money(sanitizeMoneyInput(value || '0')).plus(sanitizeMoneyInput(sum)).toString(),
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
        value={value}
        helperText={errorText || ' '}
        error={Boolean(errorText)}
        onChange={onChange}
        type="text"
        autoFocus
        autoComplete="off"
      />
      <Icons.Add onClick={addToSum} />
    </SumArea>
  );
};

export const SourceSelector: React.FC<{
  value: number;
  onChange: (id: number) => void;
  sources: Source[];
  style?: React.CSSProperties;
  title: string;
}> = ({ title, value, style, onChange, sources }) => {
  const id = 'expense-dialog-source';
  return (
    <FormControl fullWidth={true} variant="standard">
      <InputLabel htmlFor={id} shrink={true}>
        {title}
      </InputLabel>
      <Select
        labelId={id}
        value={value}
        style={style}
        label={title}
        onChange={e => onChange(Number(e.target.value))}
      >
        {sources.map(s => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export const TypeSelector: React.FC<{
  value: ExpenseType;
  onChange: (s: ExpenseType) => void;
}> = ({ value, onChange }) => {
  const toggle = React.useCallback(() => {
    const toggled = expenseTypes[(expenseTypes.indexOf(value) + 1) % expenseTypes.length];
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

export const DescriptionField: React.FC<{
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}> = ({ value, errorText, onChange }) => (
  <TextEdit
    multiline={true}
    placeholder="Tarkempi selite"
    label="Selite"
    InputLabelProps={{ shrink: true }}
    fullWidth={true}
    helperText={errorText}
    error={Boolean(errorText)}
    value={value}
    onChange={onChange}
  />
);

const SumArea = styled('div')`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

export const ExpenseDialogContent = styled(DialogContent)`
  overflow-y: scroll !important;
`;
