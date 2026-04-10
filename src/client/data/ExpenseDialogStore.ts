import { create } from 'zustand';

import { ExpenseInEditor, ExpenseSplit } from 'shared/expense';

import type { ExpenseDialogObject } from './StateTypes';

interface ExpenseDialogStoreState {
  request: ExpenseDialogObject<ExpenseInEditor> | null;
  setRequest: (request: ExpenseDialogObject<ExpenseInEditor> | null) => void;
}

interface ExpenseSplitStoreState {
  request: ExpenseDialogObject<ExpenseSplit[]> | null;
  setRequest: (request: ExpenseDialogObject<ExpenseSplit[]> | null) => void;
}

export const useExpenseDialogRequestStore = create<ExpenseDialogStoreState>(set => ({
  request: null,
  setRequest: request => set({ request }),
}));

export const useExpenseSplitRequestStore = create<ExpenseSplitStoreState>(set => ({
  request: null,
  setRequest: request => set({ request }),
}));
