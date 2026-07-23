import * as React from 'react';

import type { ExpenseDivision } from 'shared/expense';
import {
  expenseBeneficiary,
  ExpenseData,
  ExpenseInEditor,
  ExpenseType,
  UserExpenseWithDetails,
} from 'shared/expense';
import { toISODate } from 'shared/time';
import { Currency } from 'shared/types';
import { eurToForeign, foreignToEur, Money, sanitizeMoneyInput } from 'shared/util';
import { useCurrencyRates } from 'client/data/useCurrencyRates';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import type { FullExpenseDialogProps } from './ExpenseDialog';
import { calculateDivision } from './ExpenseDialogData';
import { defaultExpenseSaveAction } from './ExpenseSaveAction';

const parsers: Record<string, (v: string) => string> = {
  sum: sanitizeMoneyInput,
  originalCurrencyValue: sanitizeMoneyInput,
};

function errorIf(condition: boolean, error: string): string | undefined {
  return condition ? error : undefined;
}

function validateSum(v: string): string | undefined {
  return (
    errorIf(v.length === 0, 'Summa puuttuu') ||
    errorIf(v.match(/^[0-9]+([.][0-9]{1,2})?$/) == null, 'Summa on virheellinen')
  );
}

// Id fields arrive stringified, so an unset id is the (truthy) string "0"
const missingId = (error: string) => (v: string) => errorIf(!v || v === '0', error);

const validators: Record<string, (v: string) => string | undefined> = {
  title: v => errorIf(v.length < 1, 'Nimi puuttuu'),
  sourceId: missingId('Lähde puuttuu'),
  categoryId: missingId('Kategoria puuttuu'),
  receiver: v => errorIf(v.length < 1, 'Kohde puuttuu'),
  sum: validateSum,
  benefit: v => errorIf(v.length < 1, 'Jonkun pitää hyötyä'),
  userId: missingId('Omistaja puuttuu'),
};

export const SourceTitles: Record<ExpenseType, string> = {
  expense: 'Lähde',
  income: 'Kohde',
  transfer: 'Maksaja',
};

export const ReceiverTitles: Record<ExpenseType, string> = {
  expense: 'Kohde',
  income: 'Maksaja',
  transfer: 'Saaja',
};

export interface ExpenseDialogState extends ExpenseInEditor {
  errors: Record<string, string | undefined>;
  valid: boolean;
  showOwnerSelect: boolean;
  division: ExpenseDivision | null;
}

function getDefaultState(
  props: FullExpenseDialogProps<ExpenseInEditor>,
  original: UserExpenseWithDetails | null,
  values: Partial<ExpenseInEditor>,
): ExpenseInEditor {
  const e = original;
  const defaultSourceId = props.group.defaultSourceId || undefined;
  // Default benefit follows the initially selected source (e.g. passed in by
  // the statement matching view), not the group's default source
  const initialSourceId = values.sourceId || (e ? e.sourceId : defaultSourceId) || 0;
  const initialSource = initialSourceId ? props.sourceMap[initialSourceId] : undefined;
  const defaultBenefitUsers = initialSource?.users.map(u => u.userId) || [props.user.id];

  return {
    title: values.title ? values.title : e ? e.title : '',
    sourceId: initialSourceId,
    categoryId: values.categoryId || (e ? e.categoryId : 0),
    receiver: values.receiver || (e ? e.receiver : ''),
    sum: values.sum ? values.sum : e ? e.sum.toString() : '',
    userId: values.userId ?? (e ? e.userId : props.user.id),
    date: toISODate(values.date || e?.date),
    benefit:
      values.benefit ||
      (e
        ? e.division.filter(d => d.type === expenseBeneficiary[e.type]).map(d => d.userId)
        : defaultBenefitUsers),
    description: values.description || e?.description || '',
    confirmed: values.confirmed !== undefined ? values.confirmed : e ? e.confirmed : true,
    type: values.type || (e ? e.type : 'expense'),
    groupingId: e?.groupingId ?? null,
    currencyId: values.currencyId ?? e?.currencyId ?? null,
    originalCurrencyValue:
      values.originalCurrencyValue ??
      (e?.originalCurrencyValue != null ? Money.from(e.originalCurrencyValue).toString() : ''),
  };
}

function validateField(key: string, value: unknown): string | undefined {
  const validator = validators[key];
  if (!validator) return undefined;
  const strValue = String(value ?? '');
  const parsed = parsers[key] ? parsers[key](strValue) : strValue;
  return validator(parsed);
}

export function useExpenseDialog(props: FullExpenseDialogProps<ExpenseInEditor>) {
  const { original, values, expenseCounter, sourceMap, categoryMap, onClose, onExpensesUpdated } =
    props;

  const [fields, setFields] = React.useState<ExpenseInEditor>(() =>
    getDefaultState(props, original, values),
  );
  const [saveLocked, setSaveLocked] = React.useState(false);
  const [showOwnerSelect, setShowOwnerSelect] = React.useState(false);
  const { rateFor } = useCurrencyRates();

  // Compute validation errors
  const errors = React.useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of Object.keys(validators)) {
      result[key] = validateField(key, fields[key as keyof ExpenseInEditor]);
    }
    // The foreign amount is required exactly when a foreign currency is selected
    result.originalCurrencyValue =
      fields.currencyId != null
        ? validateSum(sanitizeMoneyInput(fields.originalCurrencyValue))
        : undefined;
    return result;
  }, [fields]);

  const valid = React.useMemo(() => Object.values(errors).every(e => e === undefined), [errors]);

  // Compute division preview
  const division = React.useMemo(() => {
    if (!valid) return null;
    try {
      return calculateDivision(fields.type, fields.sum, fields.benefit, sourceMap[fields.sourceId]);
    } catch {
      return null;
    }
  }, [valid, fields.type, fields.sum, fields.benefit, fields.sourceId, sourceMap]);

  // Auto-update benefit when sourceId changes
  const [prevSourceId, setPrevSourceId] = React.useState(fields.sourceId);
  if (fields.sourceId !== prevSourceId) {
    setPrevSourceId(fields.sourceId);
    const source = sourceMap[fields.sourceId];
    if (source) {
      setFields(f => ({ ...f, benefit: source.users.map(u => u.userId) }));
    }
  }

  // Reset state when expense counter changes (new dialog opened). The source id is
  // synced along with it so that the reset does not look like a user source change.
  const [prevCounter, setPrevCounter] = React.useState(expenseCounter);
  if (prevCounter !== expenseCounter) {
    setPrevCounter(expenseCounter);
    const newState = getDefaultState(props, original, values);
    logger.info(newState, 'Start editing');
    setFields(newState);
    setPrevSourceId(newState.sourceId);
  }

  const setField = React.useCallback((field: string, value: unknown) => {
    const parsed = parsers[field] ? parsers[field](String(value)) : value;
    setFields(f => ({ ...f, [field]: parsed }));
  }, []);

  const requestSave = React.useCallback(
    async (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!valid || saveLocked) return;

      const expense = fields;
      const sum = Money.from(expense.sum);
      const divisionData = calculateDivision(
        expense.type,
        sum,
        expense.benefit,
        sourceMap[expense.sourceId],
      );
      const data: ExpenseData = {
        userId: expense.userId,
        categoryId: expense.categoryId,
        sourceId: expense.sourceId,
        type: expense.type,
        confirmed: expense.confirmed,
        title: expense.title,
        receiver: expense.receiver,
        description: expense.description,
        date: expense.date,
        sum: expense.sum,
        division: divisionData,
        groupingId: expense.groupingId ?? undefined,
        // Always sent as a pair: both null for a plain EUR expense
        currencyId: expense.currencyId,
        originalCurrencyValue: expense.currencyId != null ? expense.originalCurrencyValue : null,
      };

      await executeOperation(() => (props.saveAction ?? defaultExpenseSaveAction)(data, original), {
        trackProgress: setSaveLocked,
        errorMessage: 'Kirjauksen tallennus epäonnistui',
        postProcess: async savedId => {
          logger.info(`Saved expense: ${savedId}`);
          if (savedId !== null) {
            await onClose(expense);
            onExpensesUpdated(expense.date, savedId);
          }
        },
      });
    },
    [fields, valid, saveLocked, sourceMap, props.saveAction, original, onClose, onExpensesUpdated],
  );

  const dismiss = React.useCallback(() => onClose(null), [onClose]);

  const setToday = React.useCallback(() => setFields(f => ({ ...f, date: toISODate() })), []);

  const selectCategory = React.useCallback(
    (id: number) => {
      const cat = categoryMap[id];
      if (cat) {
        setFields(f => ({ ...f, categoryId: id, title: cat.name }));
      }
    },
    [categoryMap],
  );

  const closeEditors = React.useCallback(() => setShowOwnerSelect(false), []);

  const setUserId = React.useCallback((userId: number) => setFields(f => ({ ...f, userId })), []);

  const currency = props.currencies.find(c => c.id === fields.currencyId);
  const rate = rateFor(currency?.code);

  /** Passing null returns the expense to plain EUR, discarding the foreign amount */
  const selectCurrency = React.useCallback(
    (selected: Currency | null) =>
      setFields(f => ({
        ...f,
        currencyId: selected?.id ?? null,
        originalCurrencyValue: selected ? f.originalCurrencyValue : '',
      })),
    [],
  );

  const convertToEur = React.useCallback(() => {
    if (!rate) return;
    setFields(f => {
      const converted = Money.parse(sanitizeMoneyInput(f.originalCurrencyValue));
      return converted ? { ...f, sum: foreignToEur(converted, rate).toString() } : f;
    });
  }, [rate]);

  const convertToCurrency = React.useCallback(() => {
    if (!rate) return;
    setFields(f => {
      const converted = Money.parse(sanitizeMoneyInput(f.sum));
      return converted
        ? { ...f, originalCurrencyValue: eurToForeign(converted, rate).toString() }
        : f;
    });
  }, [rate]);

  const state: ExpenseDialogState = {
    ...fields,
    errors,
    valid,
    showOwnerSelect,
    division,
  };

  return {
    state,
    setField,
    requestSave,
    dismiss,
    setToday,
    selectCategory,
    closeEditors,
    setUserId,
    currency,
    canConvert: rate !== undefined,
    selectCurrency,
    convertToEur,
    convertToCurrency,
    sourceTitle: SourceTitles[fields.type] ?? 'Lähde',
    receiverTitle: ReceiverTitles[fields.type] ?? 'Kohde',
  };
}
