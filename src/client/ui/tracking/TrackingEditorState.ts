import { create } from 'zustand';

import { ObjectId, TrackingSubject, TrackingSubjectData } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { executeOperation } from 'client/util/ExecuteOperation';

export type TrackingState = {
  title: string;
  id: ObjectId | null;
  setTitle: (title: string) => void;
  reset: (tracking: TrackingSubject | null) => void;
  inputValid: () => boolean;
  saveTracking(...callbacks: (() => void)[]): Promise<void>;
};

export const useTrackingState = create<TrackingState>((set, get) => ({
  title: '',
  id: null,
  setTitle: title => set({ title }),
  reset: tracking =>
    set({
      id: tracking?.id ?? null,
      title: tracking?.title ?? '',
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
}));
