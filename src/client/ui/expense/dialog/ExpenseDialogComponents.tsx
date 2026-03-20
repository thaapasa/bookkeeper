import styled from '@emotion/styled';
import { ActionIcon, Group, Select } from '@mantine/core';
import * as React from 'react';

import { ExpenseType, expenseTypes, getExpenseTypeLabel } from 'shared/expense';
import { Source } from 'shared/types';
import { Money, sanitizeMoneyInput } from 'shared/util';
import { TextEdit } from 'client/ui/component/TextEdit';
import { ExpenseTypeIcon } from 'client/ui/icons/ExpenseType';
import { Icons } from 'client/ui/icons/Icons';

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
        value={value}
        error={errorText || undefined}
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
  return (
    <div style={{ width: '100%', ...style }}>
      <Select
        label={title}
        value={String(value)}
        onChange={v => onChange(Number(v ?? 0))}
        data={sources.map(s => ({ value: String(s.id), label: s.name }))}
      />
    </div>
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
    <Group>
      <ActionIcon variant="subtle" onClick={toggle}>
        <ExpenseTypeIcon type={value} size={24} />
      </ActionIcon>
      {getExpenseTypeLabel(value)}
    </Group>
  );
};

export const DescriptionField: React.FC<{
  value: string;
  errorText?: string;
  onChange: (s: string) => void;
}> = ({ value, errorText, onChange }) => (
  <TextEdit
    placeholder="Tarkempi selite"
    label="Selite"
    error={errorText || undefined}
    value={value}
    onChange={onChange}
  />
);

const SumArea = styled.div`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

export const ExpenseDialogContent = styled.div<{ dividers?: boolean }>`
  overflow-y: auto;
  padding: 16px 24px;
  ${p => (p.dividers ? `border-top: 1px solid var(--mantine-color-default-border); border-bottom: 1px solid var(--mantine-color-default-border);` : '')}
`;
