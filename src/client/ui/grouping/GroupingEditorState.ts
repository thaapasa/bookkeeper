import { colors } from '@mui/material';
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
  color: string;
  tags: string[];
  startDate: ISODate | null;
  endDate: ISODate | null;
  private: boolean;
  onlyOwn: boolean;
  reset(grouping: ExpenseGrouping | null): void;
  setTitle(title: string): void;
  setPrivate(isPrivate: boolean): void;
  setOnlyOwn(onlyOwn: boolean): void;
  setStartDate(date: ISODate | null): void;
  setEndDate(date: ISODate | null): void;
  setColor(color: string): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
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
  color: colors.green[400],
  categories: [],
  private: false,
  onlyOwn: false,
  tags: [],
  setTitle: title => set({ title }),
  setColor: color => set({ color }),
  setStartDate: startDate => set({ startDate }),
  setEndDate: endDate => set({ endDate }),
  setPrivate: isPrivate => set({ private: isPrivate }),
  setOnlyOwn: onlyOwn => set({ onlyOwn }),
  addTag: tag => {
    const trimmed = tag?.trim();
    if (trimmed) {
      set({ tags: [...new Set([...get().tags, tag])] });
    }
  },
  removeTag: tag => set({ tags: get().tags.filter(t => t !== tag) }),
  reset: grouping =>
    set({
      id: grouping?.id ?? null,
      title: grouping?.title ?? '',
      color: grouping?.color ?? '',
      private: grouping?.private ?? false,
      onlyOwn: grouping?.onlyOwn ?? false,
      tags: [...(grouping?.tags ?? [])],
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
      color: s.color,
      tags: s.tags,
      private: s.private,
      onlyOwn: s.onlyOwn,
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
