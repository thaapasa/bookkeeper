import { create } from 'zustand';

import { ExpenseShortcut, ExpenseShortcutData, ExpenseShortcutPayload } from 'shared/expense';
import { requireDefined } from 'shared/util';

export type ShortcutState = {
  title: string;
  background: string;
  expenseStr: string;
  setTitle: (title: string) => void;
  setBackground: (background: string) => void;
  setExpense: (expense: string) => void;
  reset: (shortcut: ExpenseShortcut) => void;
  inputValid: () => boolean;
  toPayload: () => ExpenseShortcutPayload;
  margin: string;
  setMargin: (margin: string) => void;
};

export const useShortcutState = create<ShortcutState>((set, get) => ({
  title: '',
  background: '',
  expenseStr: '',
  margin: '0',
  setTitle: title => set({ title }),
  setBackground: background => set({ background }),
  setExpense: expenseStr => set({ expenseStr }),
  setMargin: margin => set({ margin }),
  reset: shortcut =>
    set({
      title: shortcut.title,
      background: shortcut.background ?? '',
      expenseStr: JSON.stringify(shortcut.expense ?? {}, null, 2),
      margin: '0',
    }),
  inputValid: () => {
    const s = get();
    return !!s.title && parseExpense(s.expenseStr) !== undefined;
  },
  toPayload: () => {
    const s = get();
    return {
      title: s.title,
      background: s.background || undefined,
      expense: requireDefined(parseExpense(s.expenseStr), 'parsed expense data'),
    };
  },
}));

function parseExpense(expenseStr: string): ExpenseShortcutData | undefined {
  try {
    const d = JSON.parse(expenseStr);
    const parsed = ExpenseShortcutData.parse(d);
    return parsed;
  } catch (e) {
    return undefined;
  }
}
