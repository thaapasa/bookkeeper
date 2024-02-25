import { create } from 'zustand';

import { ISODate } from 'shared/time';
import { ExpenseGrouping, ExpenseGroupingData, ObjectId } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { UserPrompts } from '../dialog/DialogState';

export type GroupingState = {
  title: string;
  id: ObjectId | null;
  categories: number[];
  startDate: ISODate | null;
  endDate: ISODate | null;
  reset(grouping: ExpenseGrouping | null): void;
  setTitle(title: string): void;
  setStartDate(date: ISODate | null): void;
  setEndDate(date: ISODate | null): void;
  inputValid(): boolean;
  saveGrouping(...callbacks: (() => void)[]): Promise<void>;
  uploadImage(file: File, filename: string, ...callbacks: (() => void)[]): Promise<void>;
  removeImage(...callbacks: (() => void)[]): Promise<void>;
  addCategory(): Promise<void>;
  removeCategory(categoryId: ObjectId): void;
};

export const useGroupingState = create<GroupingState>((set, get) => ({
  title: '',
  id: null,
  startDate: null,
  endDate: null,
  categories: [],
  setTitle: title => set({ title }),
  setStartDate: startDate => set({ startDate }),
  setEndDate: endDate => set({ endDate }),
  reset: grouping =>
    set({
      id: grouping?.id ?? null,
      title: grouping?.title ?? '',
      categories: grouping?.categories ?? [],
      startDate: grouping?.startDate || null,
      endDate: grouping?.endDate || null,
    }),
  inputValid: () => {
    const s = get();
    return !!s.title;
  },
  saveGrouping: async (...callbacks) => {
    const s = get();
    const id = s.id;
    if (!s.inputValid()) {
      return;
    }
    const payload: ExpenseGroupingData = {
      title: s.title,
      categories: s.categories.length ? s.categories : [],
      startDate: s.startDate ?? undefined,
      endDate: s.endDate ?? undefined,
    };
    await executeOperation(
      () =>
        id
          ? apiConnect.updateExpenseGrouping(id, payload)
          : apiConnect.createExpenseGrouping(payload),
      {
        postProcess: updateSession,
        success: id ? 'Ryhmittely päivitetty' : 'Ryhmittely luotu',
        throw: true,
      },
    );
    callbacks.forEach(c => c());
  },
  uploadImage: async (file, filename, ...callbacks) => {
    const id = get().id;
    if (!id) return;
    await executeOperation(() => apiConnect.uploadGroupingImage(id, file, filename));
    callbacks.forEach(c => c());
  },
  removeImage: async (...callbacks) => {
    const id = get().id;
    if (!id) return;
    await executeOperation(() => apiConnect.deleteGroupingImage(id));
    callbacks.forEach(c => c());
  },
  addCategory: async () => {
    const category = await UserPrompts.promptCategory(
      'Valitse kategoria',
      'Valitse seurattava kategoria',
    );
    if (!category) {
      return;
    }
    const cats = get().categories;
    if (!cats.includes(category)) {
      logger.info(`Adding category ${category} to grouping`);
      set({ categories: [...cats, category] });
    }
  },
  removeCategory: (categoryId: ObjectId) => {
    set({ categories: get().categories.filter(c => c !== categoryId) });
  },
}));