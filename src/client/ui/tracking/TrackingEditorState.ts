import { create } from 'zustand';

import { intRange } from 'shared/math';
import { isSameInterval, MomentInterval } from 'shared/time';
import {
  ObjectId,
  TrackingChartType,
  TrackingFrequency,
  TrackingSubject,
  TrackingSubjectData,
} from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { UserPrompts } from '../dialog/DialogState';

interface RangeOption {
  title: string;
  interval: MomentInterval;
  key: string;
}

const DefaultRange = 'y3';

const DefaultTrackingFrequency = 'month' as const;

const RangeOptions: RangeOption[] = intRange(1, 10).map(i => ({
  title: `${i} ${i === 1 ? 'vuosi' : 'vuotta'}`,
  interval: { amount: i, unit: 'year' },
  key: `y${i}`,
}));

export type TrackingState = {
  title: string;
  id: ObjectId | null;
  categories: number[];
  colorOffset: string;
  range: string;
  frequency: TrackingFrequency;
  chartType: TrackingChartType;
  separateByUser: boolean;
  reset(tracking: TrackingSubject | null): void;
  setTitle(title: string): void;
  getRangeOptions(): RangeOption[];
  setColorOffset(colorOffset: string): void;
  setRange(range: string): void;
  setFrequency(frequency: string): void;
  setChartType(chartType: string): void;
  inputValid(): boolean;
  saveTracking(...callbacks: (() => void)[]): Promise<void>;
  uploadImage(file: File, filename: string, ...callbacks: (() => void)[]): Promise<void>;
  removeImage(...callbacks: (() => void)[]): Promise<void>;
  addCategory(): Promise<void>;
  removeCategory(categoryId: ObjectId): void;
  setSeparateByUser(byUser: boolean): void;
};

export const useTrackingState = create<TrackingState>((set, get) => ({
  title: '',
  id: null,
  categories: [],
  colorOffset: '0',
  range: DefaultRange,
  frequency: DefaultTrackingFrequency,
  chartType: 'line',
  separateByUser: false,
  setTitle: title => set({ title }),
  reset: tracking =>
    set({
      id: tracking?.id ?? null,
      title: tracking?.title ?? '',
      range:
        RangeOptions.find(o => isSameInterval(o.interval, tracking?.trackingData.range))?.key ??
        DefaultRange,
      frequency: tracking?.trackingData.frequency ?? DefaultTrackingFrequency,
      categories: tracking?.trackingData.categories ?? [],
      colorOffset: String(tracking?.trackingData.colorOffset ?? 0),
      chartType: tracking?.trackingData.chartType ?? 'line',
      separateByUser: tracking?.trackingData.separateByUser ?? false,
    }),
  setChartType: type => set({ chartType: type as TrackingChartType }),
  setFrequency: freq =>
    set({
      frequency: TrackingFrequency.options.includes(freq as any)
        ? (freq as any)
        : DefaultTrackingFrequency,
    }),
  getRangeOptions: () => RangeOptions,
  setColorOffset: colorOffset => set({ colorOffset }),
  setRange: range => set({ range }),
  setSeparateByUser: separateByUser => set({ separateByUser }),
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
        colorOffset: Number(s.colorOffset),
        range: RangeOptions.find(r => r.key === s.range)?.interval,
        frequency: s.frequency,
        chartType: s.chartType,
        separateByUser: s.separateByUser,
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
  removeCategory: (categoryId: ObjectId) => {
    set({ categories: get().categories.filter(c => c !== categoryId) });
  },
}));
