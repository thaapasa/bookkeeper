import { create } from 'zustand';

import { ExpenseShortcut, ExpenseShortcutData, ExpenseShortcutPayload } from 'shared/expense';
import { ObjectId } from 'shared/types';
import { requireDefined } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { executeOperation } from 'client/util/ExecuteOperation';

export type ShortcutState = {
  title: string;
  background: string;
  expenseStr: string;
  id: ObjectId | undefined;
  setTitle: (title: string) => void;
  setBackground: (background: string) => void;
  setExpense: (expense: string) => void;
  reset: (shortcut: ExpenseShortcut) => void;
  inputValid: () => boolean;
  margin: string;
  setMargin: (margin: string) => void;
  saveShortcut(onClose: () => void): Promise<void>;
  uploadShortcutIcon(file: File, filename: string): Promise<ExpenseShortcut | undefined>;
  removeIcon(): Promise<void>;
};

export const useShortcutState = create<ShortcutState>((set, get) => ({
  title: '',
  background: '',
  expenseStr: '',
  margin: '0',
  id: undefined,
  setTitle: title => set({ title }),
  setBackground: background => set({ background }),
  setExpense: expenseStr => set({ expenseStr }),
  setMargin: margin => set({ margin }),
  reset: shortcut =>
    set({
      id: shortcut.id,
      title: shortcut.title,
      background: shortcut.background ?? '',
      expenseStr: JSON.stringify(shortcut.expense ?? {}, null, 2),
      margin: '0',
    }),
  inputValid: () => {
    const s = get();
    return !!s.title && parseExpense(s.expenseStr) !== undefined;
  },
  saveShortcut: async onClose => {
    const s = get();
    const id = s.id;
    if (!s.inputValid() || !id) {
      return;
    }
    const payload: ExpenseShortcutPayload = {
      title: s.title,
      background: s.background || undefined,
      expense: requireDefined(parseExpense(s.expenseStr), 'parsed expense data'),
    };
    await executeOperation(() => apiConnect.updateShortcut(id, payload), {
      postProcess: updateSession,
      success: 'Linkki päivitetty',
      throw: true,
    });
    onClose();
  },
  uploadShortcutIcon: async (file, filename) => {
    const { id, margin } = get();
    if (!id) {
      return;
    }
    return await executeOperation(
      () => apiConnect.uploadShortcutIcon(id, file, filename, Number(margin)),
      {
        postProcess: updateSession,
        success: 'Ikoni päivitetty',
        throw: true,
      },
    );
  },
  removeIcon: async () => {
    const { id } = get();
    if (!id) {
      return;
    }
    await executeOperation(() => apiConnect.removeShortcutIcon(id), {
      postProcess: updateSession,
      success: 'Ikoni poistettu',
    });
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
