import * as B from 'baconjs';
import * as React from 'react';

import type { ExpenseDivision } from 'shared/expense';
import {
  expenseBeneficiary,
  ExpenseData,
  ExpenseInEditor,
  ExpenseType,
  UserExpenseWithDetails,
} from 'shared/expense';
import { toDateTime, toISODate } from 'shared/time';
import { Category, CategoryMap } from 'shared/types';
import { identity, Money, omit, sanitizeMoneyInput, valuesToArray } from 'shared/util';
import { isSubcategoryOf } from 'client/data/Categories';
import { notifyError } from 'client/data/State';
import { logger } from 'client/Logger';
import { usePersistentMemo } from 'client/ui/hooks/usePersistentMemo';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';

import { ExpenseDialogProps } from './ExpenseDialog';
import { calculateDivision } from './ExpenseDialogData';
import { defaultExpenseSaveAction } from './ExpenseSaveAction';

type CategoryInfo = Pick<Category, 'name' | 'id'>;

const fields: ReadonlyArray<keyof ExpenseInEditor> = [
  'title',
  'sourceId',
  'categoryId',
  'subcategoryId',
  'receiver',
  'sum',
  'userId',
  'date',
  'benefit',
  'description',
  'confirmed',
  'type',
  'userId',
  'groupingId',
];

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

function allTrue(...args: boolean[]): boolean {
  return args.reduce((a, b) => a && b, true);
}

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
  subcategories: CategoryInfo[];
  errors: Record<string, string | undefined>;
  valid: boolean;
  showOwnerSelect: boolean;
  division: ExpenseDivision | null;
}

function findParentCategory(categoryId: number, categoryMap: CategoryMap): number | undefined {
  let current = categoryMap[categoryId];
  while (current?.parentId && current.parentId > 0) {
    current = categoryMap[current.parentId];
  }
  return current ? current.id : undefined;
}

function getDefaultState(
  props: ExpenseDialogProps<ExpenseInEditor>,
  original: UserExpenseWithDetails | null,
  values: Partial<ExpenseInEditor>,
): ExpenseDialogState {
  const e = original;
  const defaultSourceId = props.group.defaultSourceId || undefined;
  const defaultSource = defaultSourceId ? props.sourceMap[defaultSourceId] : undefined;
  const defaultBenefitUsers = defaultSource?.users.map(u => u.userId) || [props.user.id];

  return {
    title: values.title ? values.title : e ? e.title : '',
    sourceId: values.sourceId || (e ? e.sourceId : defaultSourceId) || 0,
    categoryId:
      values.categoryId || (e && findParentCategory(e.categoryId, props.categoryMap)) || 0,
    subcategoryId: values.subcategoryId || (e ? e.categoryId : 0),
    receiver: values.receiver || (e ? e.receiver : ''),
    sum: values.sum ? values.sum : e ? e.sum.toString() : '',
    userId: e ? e.userId : props.user.id,
    date: toDateTime(values.date || e?.date),
    benefit:
      values.benefit ||
      (e
        ? e.division.filter(d => d.type === expenseBeneficiary[e.type]).map(d => d.userId)
        : defaultBenefitUsers),
    description: values.description || e?.description || '',
    confirmed: values.confirmed !== undefined ? values.confirmed : e ? e.confirmed : true,
    type: values.type || (e ? e.type : 'expense'),
    subcategories: [],
    groupingId: e?.groupingId ?? null,
    errors: {},
    valid: false,
    showOwnerSelect: false,
    division: null,
  };
}

export function useExpenseDialog(props: ExpenseDialogProps<ExpenseInEditor>) {
  const { original, values, expenseCounter, sourceMap, categoryMap, onClose, onExpensesUpdated } =
    props;

  const [state, setState] = React.useState<ExpenseDialogState>(() =>
    getDefaultState(props, original, values),
  );

  // Create stable stream instances
  const inputStreams = usePersistentMemo(() => {
    const streams: Record<string, B.Bus<any>> = {};
    fields.forEach(k => {
      streams[k] = new B.Bus<any>();
    });
    return streams;
  }, []);
  const submitStream = usePersistentMemo(() => new B.Bus<true>(), []);
  const saveLock = usePersistentMemo(() => new B.Bus<boolean>(), []);

  // Use ref for save callback so it always has current props
  const saveRef = React.useRef<((expense: ExpenseInEditor) => Promise<void>) | undefined>(
    undefined,
  );
  React.useEffect(() => {
    saveRef.current = async (expense: ExpenseInEditor) => {
      const sum = Money.from(expense.sum);
      const division = calculateDivision(
        expense.type,
        sum,
        expense.benefit,
        sourceMap[expense.sourceId],
      );
      const data: ExpenseData = {
        ...omit(['subcategoryId', 'benefit'], expense),
        division,
        date: toISODate(expense.date),
        categoryId: expense.subcategoryId ? expense.subcategoryId : expense.categoryId,
        groupingId: expense.groupingId ?? undefined,
      };

      saveLock.push(true);
      try {
        const r = await (props.saveAction ?? defaultExpenseSaveAction)(data, original);
        logger.info(`Saved expense: ${r}`);
        if (r) {
          await onClose(expense);
          onExpensesUpdated(toDateTime(expense.date));
        }
      } catch (error) {
        logger.error(error, 'Failed to save expense');
        notifyError('Kirjauksen tallennus epäonnistui', error);
      } finally {
        saveLock.push(false);
      }
    };
  });

  // Set up Bacon.js stream pipelines (runs once on mount)
  React.useEffect(() => {
    const unsubs: Unsubscriber[] = [submitStream, saveLock];

    const validity: Record<string, B.Property<boolean>> = {};
    const streamValues: Record<keyof ExpenseInEditor, B.EventStream<any>> = {} as any;

    fields.forEach(k => {
      unsubs.push(inputStreams[k]);
      inputStreams[k].onValue(v => setState(s => ({ ...s, [k]: v })));
      const parsed = parsers[k] ? inputStreams[k].map(parsers[k]) : inputStreams[k].map(identity);
      streamValues[k] = parsed;
      const validator = validators[k];
      if (validator) {
        const error = parsed.map(v => validator(v));
        error.onValue(e => setState(s => ({ ...s, errors: { ...s.errors, [k]: e } })));
        const isValid = error.map(v => v === undefined).toProperty();
        validity[k] = isValid;
      } else {
        validity[k] = B.constant(true);
      }
    });

    streamValues.categoryId.onValue(id => {
      setState(s => ({
        ...s,
        subcategories: categoryMap[id]?.children || [],
      }));
    });

    B.combineAsArray(streamValues.categoryId, streamValues.subcategoryId).onValue(([id, subId]) => {
      if (subId > 0 && !isSubcategoryOf(subId, id, categoryMap)) {
        inputStreams.subcategoryId.push(0);
      }
    });

    streamValues.sourceId.onValue(v =>
      inputStreams.benefit.push(sourceMap[v].users.map(u => u.userId)),
    );

    const allValid = B.combineWith(allTrue, valuesToArray(validity) as any);
    allValid.onValue(valid => setState(s => ({ ...s, valid })));

    const expense: B.Property<ExpenseInEditor> = B.combineTemplate(streamValues);
    B.combineTemplate({ expense, allValid })
      .map(({ allValid, expense }) =>
        allValid
          ? calculateDivision(
              expense.type,
              expense.sum,
              expense.benefit,
              sourceMap[expense.sourceId],
            )
          : null,
      )
      .onValue(division => setState(s => ({ ...s, division })));

    B.combineWith(
      (e, v, h) => ({ ...e, allValid: v && !h }),
      expense,
      allValid,
      saveLock.toProperty(false),
    )
      .sampledBy(submitStream)
      .filter(e => e.allValid)
      .onValue(e => saveRef.current?.(e));

    return () => unsubscribeAll(unsubs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push values to streams when expense changes (initial + counter updates)
  const counterRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (counterRef.current !== expenseCounter) {
      counterRef.current = expenseCounter;
      const newState = getDefaultState(props, original, values);
      logger.info(newState, 'Start editing');
      fields.forEach(k => inputStreams[k].push(newState[k]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseCounter]);

  // Push initial values on mount
  React.useEffect(() => {
    const initState = getDefaultState(props, original, values);
    logger.info(initState, 'Start editing');
    fields.forEach(k => inputStreams[k].push(initState[k]));
    counterRef.current = expenseCounter;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = React.useCallback(
    (field: string, value: any) => {
      inputStreams[field].push(value);
    },
    [inputStreams],
  );

  const requestSave = React.useCallback(
    (event: React.SyntheticEvent) => {
      submitStream.push(true);
      event.preventDefault();
      event.stopPropagation();
    },
    [submitStream],
  );

  const dismiss = React.useCallback(() => onClose(null), [onClose]);

  const setToday = React.useCallback(() => inputStreams.date.push(toDateTime()), [inputStreams]);

  const selectCategory = React.useCallback(
    (id: number) => {
      const m = categoryMap;
      const name = m[id].name;
      const parentId = m[id].parentId;
      if (parentId) {
        inputStreams.categoryId.push(parentId);
        inputStreams.subcategoryId.push(id);
      } else {
        inputStreams.categoryId.push(id);
        inputStreams.subcategoryId.push(0);
      }
      inputStreams.title.push(name);
    },
    [categoryMap, inputStreams],
  );

  const closeEditors = React.useCallback(
    () => setState(s => ({ ...s, showOwnerSelect: false })),
    [],
  );

  const setUserId = React.useCallback(
    (userId: number) => {
      inputStreams.userId.push(userId);
    },
    [inputStreams],
  );

  return {
    state,
    setField,
    requestSave,
    dismiss,
    setToday,
    selectCategory,
    closeEditors,
    setUserId,
    sourceTitle: SourceTitles[state.type] ?? 'Lähde',
    receiverTitle: ReceiverTitles[state.type] ?? 'Kohde',
  };
}
