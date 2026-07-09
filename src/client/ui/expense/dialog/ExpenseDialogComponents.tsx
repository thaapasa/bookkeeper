import { ActionIcon, Box, BoxProps, Button, Group, Menu, Select, Tooltip } from '@mantine/core';
import * as React from 'react';

import { ExpenseType, expenseTypes, getExpenseTypeLabel } from 'shared/expense';
import { Currency, Source } from 'shared/types';
import { countryCodeToFlag, evaluateMoneyExpression } from 'shared/util';
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
    /** Only one field per dialog may claim the initial focus */
    withAutoFocus?: boolean;
  } & TextEditProps
> = ({ value, onChange, errorText, withAutoFocus = true, ...props }) => {
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
      autoComplete="off"
      {...(withAutoFocus ? { 'data-autofocus': true } : {})}
      {...props}
    />
  );
};

/**
 * The currency adornment inside the sum field. Clicking it picks the currency the expense
 * was originally paid in, or returns the expense to plain EUR.
 *
 * The symbol stays `€` regardless of the selection: the field it adorns always holds the
 * EUR sum. The chosen foreign currency labels its own field instead.
 */
export const CurrencySelector: React.FC<{
  currencies: Currency[];
  selected: Currency | undefined;
  onSelect: (currency: Currency | null) => void;
}> = ({ currencies, selected, onSelect }) => (
  <Menu shadow="md" position="bottom-end">
    <Menu.Target>
      <ActionIcon type="button" aria-label="Valitse valuutta">
        €
      </ActionIcon>
    </Menu.Target>
    <Menu.Dropdown className={styles.currencyDropdown}>
      <Menu.Item leftSection="🇪🇺" disabled={!selected} onClick={() => onSelect(null)}>
        € EUR
      </Menu.Item>
      <Menu.Divider />
      {currencies.map(c => (
        <Menu.Item
          key={c.id}
          leftSection={countryCodeToFlag(c.countryCode)}
          disabled={c.id === selected?.id}
          onClick={() => onSelect(c)}
        >
          {c.symbol} {c.code}
        </Menu.Item>
      ))}
    </Menu.Dropdown>
  </Menu>
);

/**
 * Shown only when the expense was paid in a foreign currency. Both amounts are editable by
 * hand — the convert buttons are an aid for when you only know one of them, not a binding
 * relationship. The EUR sum always remains the source of truth.
 */
export const OriginalCurrencyField: React.FC<
  {
    currency: Currency;
    value: string;
    errorText?: string;
    canConvert: boolean;
    onChange: (s: string) => void;
    onConvertToEur: () => void;
    onConvertToCurrency: () => void;
  } & BoxProps
> = ({
  currency,
  value,
  errorText,
  canConvert,
  onChange,
  onConvertToEur,
  onConvertToCurrency,
  ...boxProps
}) => {
  const disabledReason = canConvert ? undefined : 'Valuuttakursseja ei saatavilla';
  return (
    <Group wrap="nowrap" align="flex-start" gap="sm" {...boxProps}>
      <SumField
        label={`Summa (${currency.code})`}
        name="originalCurrencyValue"
        value={value}
        errorText={errorText}
        onChange={onChange}
        rightSection={currency.symbol}
        withAutoFocus={false}
      />
      <Group wrap="nowrap" gap="xs" mt={26}>
        <Tooltip label={disabledReason ?? 'Muunna summa euroiksi'}>
          <Button
            type="button"
            variant="light"
            size="xs"
            disabled={!canConvert}
            onClick={onConvertToEur}
          >
            → €
          </Button>
        </Tooltip>
        <Tooltip label={disabledReason ?? `Muunna summa valuuttaan ${currency.code}`}>
          <Button
            type="button"
            variant="light"
            size="xs"
            disabled={!canConvert}
            onClick={onConvertToCurrency}
          >
            → {currency.symbol}
          </Button>
        </Tooltip>
      </Group>
    </Group>
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
