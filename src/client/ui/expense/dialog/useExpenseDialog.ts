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
import { Money, sanitizeMoneyInput } from 'shared/util';
import { notifyError } from 'client/data/NotificationStore';
import { logger } from 'client/Logger';

import type { FullExpenseDialogProps } from './ExpenseDialog';
import { calculateDivision } from './ExpenseDialogData';
import { defaultExpenseSaveAction } from './ExpenseSaveAction';

const parsers: Record<string, (v: string) => string> = {
  sum: sanitizeMoneyInput,
};

function errorIf(condition: boolean, error: string): string | undefined {
  return condition ? error : undefined;
}

const validators: Record<string, (v: string) => string | undefined> = {
  title: v => errorIf(v.length < 1, 'Nimi puuttuu'),
  sourceId: v => errorIf(!v, 'Lähde puuttuu'),
  categoryId: v => errorIf(!v, 'Kategoria puuttuu'),
  receiver: v => errorIf(v.length < 1, 'Kohde puuttuu'),
  sum: v =>
    errorIf(v.length === 0, 'Summa puuttuu') ||
    errorIf(v.match(/^[0-9]+([.][0-9]{1,2})?$/) == null, 'Summa on virheellinen'),
  benefit: v => errorIf(v.length < 1, 'Jonkun pitää hyötyä'),
  userId: v => errorIf(!v, 'Omistaja puuttuu'),
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
  const defaultSource = defaultSourceId ? props.sourceMap[defaultSourceId] : undefined;
  const defaultBenefitUsers = defaultSource?.users.map(u => u.userId) || [props.user.id];

  return {
    title: values.title ? values.title : e ? e.title : '',
    sourceId: values.sourceId || (e ? e.sourceId : defaultSourceId) || 0,
    categoryId: values.categoryId || (e ? e.categoryId : 0),
    receiver: values.receiver || (e ? e.receiver : ''),
    sum: values.sum ? values.sum : e ? e.sum.toString() : '',
    userId: e ? e.userId : props.user.id,
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

  // Compute validation errors
  const errors = React.useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of Object.keys(validators)) {
      result[key] = validateField(key, fields[key as keyof ExpenseInEditor]);
    }
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
  const prevSourceIdRef = React.useRef(fields.sourceId);
  React.useEffect(() => {
    if (fields.sourceId === prevSourceIdRef.current) return;
    prevSourceIdRef.current = fields.sourceId;
    const source = sourceMap[fields.sourceId];
    if (source) {
      setFields(f => ({ ...f, benefit: source.users.map(u => u.userId) }));
    }
  }, [fields.sourceId, sourceMap]);

  // Reset state when expense counter changes (new dialog opened)
  const counterRef = React.useRef(expenseCounter);
  React.useEffect(() => {
    if (counterRef.current !== expenseCounter) {
      counterRef.current = expenseCounter;
      const newState = getDefaultState(props, original, values);
      logger.info(newState, 'Start editing');
      setFields(newState);
      prevSourceIdRef.current = newState.sourceId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseCounter]);

  const setField = React.useCallback((field: string, value: unknown) => {
    const parsed = parsers[field] ? parsers[field](String(value)) : value;
    setFields(f => ({ ...f, [field]: parsed }));
  }, []);

  // Save handler - uses refs to always read the latest state
  const fieldsRef = React.useRef(fields);
  fieldsRef.current = fields;
  const validRef = React.useRef(valid);
  validRef.current = valid;

  const requestSave = React.useCallback(
    async (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!validRef.current || saveLocked) return;

      const expense = fieldsRef.current;
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
      };

      setSaveLocked(true);
      try {
        const r = await (props.saveAction ?? defaultExpenseSaveAction)(data, original);
        logger.info(`Saved expense: ${r}`);
        if (r) {
          await onClose(expense);
          onExpensesUpdated(expense.date);
        }
      } catch (error) {
        logger.error(error, 'Failed to save expense');
        notifyError('Kirjauksen tallennus epäonnistui', error);
      } finally {
        setSaveLocked(false);
      }
    },
    [saveLocked, sourceMap, props.saveAction, original, onClose, onExpensesUpdated],
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
    sourceTitle: SourceTitles[fields.type] ?? 'Lähde',
    receiverTitle: ReceiverTitles[fields.type] ?? 'Kohde',
  };
}
