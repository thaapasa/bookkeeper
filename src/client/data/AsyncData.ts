export interface AsyncDataUninitialized {
  type: 'uninitialized';
}

export interface AsyncDataLoading {
  type: 'loading';
}

export interface AsyncDataLoaded<T> {
  type: 'loaded';
  value: T;
}

export interface AsyncDataError {
  type: 'error';
  error: any;
}

export type AsyncData<T> =
  | AsyncDataUninitialized
  | AsyncDataLoading
  | AsyncDataLoaded<T>
  | AsyncDataError;

export const UninitializedData: AsyncDataUninitialized = Object.freeze({
  type: 'uninitialized',
});
