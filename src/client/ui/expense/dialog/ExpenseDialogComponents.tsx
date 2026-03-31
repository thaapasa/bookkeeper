import { ActionIcon, Box, BoxProps, Group, Select } from '@mantine/core';
import * as React from 'react';

import { ExpenseType, expenseTypes, getExpenseTypeLabel } from 'shared/expense';
import { Source } from 'shared/types';
import { Money, sanitizeMoneyInput } from 'shared/util';
import { TextEdit, TextEditProps } from 'client/ui/component/TextEdit';
import { ExpenseTypeIcon } from 'client/ui/icons/ExpenseType';
import { Icons } from 'client/ui/icons/Icons';
import { classNames } from 'client/ui/utils/classNames';

import styles from './ExpenseDialog.module.css';

export const SumField: React.FC<
  {
    value: string;
    errorText?: string;
    onChange: (s: string) => void;
  } & TextEditProps
> = ({ value, onChange, errorText, ...props }) => {
  const addToSum = () => {
    const sum = window.prompt('Syötä summaan lisättävä määrä:');
    if (sum) {
      onChange(
        new Money(sanitizeMoneyInput(value || '0')).plus(sanitizeMoneyInput(sum)).toString(),
      );
    }
  };
  return (
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
      rightSection={<Icons.Add onClick={addToSum} />}
      {...props}
    />
  );
};

export const SourceSelector: React.FC<
  {
    value: number;
    onChange: (id: number) => void;
    sources: Source[];
    title: string;
  } & Omit<BoxProps, 'onChange'>
> = ({ title, value, onChange, sources, ...boxProps }) => (
  <Select
    label={title}
    value={String(value)}
    onChange={v => onChange(Number(v ?? 0))}
    data={sources.map(s => ({ value: String(s.id), label: s.name }))}
    {...boxProps}
  />
);

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
    <Group w={100} gap="xs">
      <ActionIcon onClick={toggle}>
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

export const ExpenseDialogContent: React.FC<
  React.PropsWithChildren<{ dividers?: boolean } & BoxProps & React.ComponentPropsWithoutRef<'div'>>
> = ({ dividers, className, children, ...props }) => (
  <Box
    className={classNames(
      styles.dialogContent,
      dividers ? styles.dialogContentDividers : undefined,
      className,
    )}
    {...props}
  >
    {children}
  </Box>
);
