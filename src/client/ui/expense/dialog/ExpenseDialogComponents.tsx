import { ActionIcon, Box, BoxProps, Group, Select } from '@mantine/core';
import * as React from 'react';

import { ExpenseType, expenseTypes, getExpenseTypeLabel } from 'shared/expense';
import { Source } from 'shared/types';
import { evaluateMoneyExpression } from 'shared/util';
import { TextEdit, TextEditProps } from 'client/ui/component/TextEdit';
import { ExpenseTypeIcon } from 'client/ui/icons/ExpenseType';
import { classNames } from 'client/ui/utils/classNames';

import styles from './ExpenseDialog.module.css';

/**
 * Money input field that supports inline arithmetic expressions.
 *
 * Users can type expressions like `124.42 - 23.42 + 3.33` or `(50 + 30) * 2`.
 * Supports `+`, `-`, `*`, `/` with standard operator precedence and parentheses.
 * Commas are accepted as decimal separators.
 *
 * While typing, the raw expression is shown in the field but `onChange` receives
 * the evaluated result, so the parent form can update calculations immediately.
 * On Enter or blur, the display is condensed to the evaluated result.
 */
export const SumField: React.FC<
  {
    value: string;
    errorText?: string;
    onChange: (s: string) => void;
  } & TextEditProps
> = ({ value, onChange, errorText, ...props }) => {
  // Local display value holds the raw expression while typing;
  // the parent receives the evaluated result via onChange on every keystroke.
  const [displayValue, setDisplayValue] = React.useState(value);
  const isLocalChange = React.useRef(false);

  // Sync display value when parent updates externally (not from our own onChange)
  React.useEffect(() => {
    if (!isLocalChange.current) {
      setDisplayValue(value);
    }
    isLocalChange.current = false;
  }, [value]);

  const evaluated = evaluateMoneyExpression(displayValue);

  const handleChange = React.useCallback(
    (raw: string) => {
      setDisplayValue(raw);
      isLocalChange.current = true;
      const result = evaluateMoneyExpression(raw);
      onChange(result ?? raw);
    },
    [onChange],
  );

  // On blur or Enter, condense the display to the evaluated result
  const condense = React.useCallback(() => {
    if (evaluated !== undefined) {
      setDisplayValue(evaluated);
      return true;
    }
    return false;
  }, [evaluated]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && condense()) {
        e.preventDefault();
      }
    },
    [condense],
  );

  return (
    <TextEdit
      placeholder="0.00"
      label="Summa"
      name="sum"
      value={displayValue}
      error={errorText || undefined}
      onChange={handleChange}
      onBlur={condense}
      onKeyDown={handleKeyDown}
      rightSection="€"
      type="text"
      data-autofocus
      autoComplete="off"
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
    errorText?: string;
  } & Omit<BoxProps, 'onChange'>
> = ({ title, value, onChange, sources, errorText, ...boxProps }) => (
  <Select
    label={title}
    value={String(value)}
    onChange={v => onChange(Number(v ?? 0))}
    data={sources.map(s => ({ value: String(s.id), label: s.name }))}
    allowDeselect={false}
    error={errorText || undefined}
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
      <ActionIcon type="button" onClick={toggle}>
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
