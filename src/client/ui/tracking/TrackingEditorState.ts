import { create } from 'zustand';

import { ObjectId, TrackingSubject, TrackingSubjectData } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { UserPrompts } from '../dialog/DialogState';

export type TrackingState = {
  title: string;
  id: ObjectId | null;
  categories: number[];
  setTitle(title: string): void;
  reset(tracking: TrackingSubject | null): void;
  inputValid(): boolean;
  saveTracking(...callbacks: (() => void)[]): Promise<void>;
  uploadImage(file: File, filename: string, ...callbacks: (() => void)[]): Promise<void>;
  removeImage(...callbacks: (() => void)[]): Promise<void>;
  addCategory(): Promise<void>;
};

export const useTrackingState = create<TrackingState>((set, get) => ({
  title: '',
  id: null,
  categories: [],
  setTitle: title => set({ title }),
  reset: tracking =>
    set({
      id: tracking?.id ?? null,
      title: tracking?.title ?? '',
      categories: tracking?.trackingData.categories ?? [],
    }),
  inputValid: () => {
    const s = get();
    return !!s.title;
  },
  saveTracking: async (...callbacks) => {
    const s = get();
    const id = s.id;
    if (!s.inputValid()) {
      return;
    }
    const payload: TrackingSubjectData = {
      title: s.title,
      trackingData: {
        categories: s.categories.length ? s.categories : undefined,
      },
    };
    await executeOperation(
      () =>
        id
          ? apiConnect.updateTrackingSubject(id, payload)
          : apiConnect.createTrackingSubject(payload),
      {
        postProcess: updateSession,
        success: id ? 'Seuranta päivitetty' : 'Seuranta luotu',
        throw: true,
      },
    );
    callbacks.forEach(c => c());
  },
  uploadImage: async (file, filename, ...callbacks) => {
    const id = get().id;
    if (!id) return;
    await executeOperation(() => apiConnect.uploadTrackingImage(id, file, filename));
    callbacks.forEach(c => c());
  },
  removeImage: async (...callbacks) => {
    const id = get().id;
    if (!id) return;
    await executeOperation(() => apiConnect.deleteTrackingImage(id));
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
      logger.info(`Adding category ${category} to tracked subject`);
      set({ categories: [...cats, category] });
    }
  },
}));
