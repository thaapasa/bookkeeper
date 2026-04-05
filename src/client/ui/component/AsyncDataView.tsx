import { Code } from '@mantine/core';
import * as React from 'react';

import {
  AsyncData,
  AsyncDataError,
  AsyncDataLoading,
  AsyncDataUninitialized,
} from 'client/data/AsyncData';

import { ErrorView } from '../general/ErrorView';
import { NoteView } from '../general/NoteView';

export type AsyncDataViewProps<T, C extends { data: T }> = {
  data: AsyncData<T>;
  renderer: React.ComponentType<C>;
  uninitializedContent?: React.ComponentType<{ data: AsyncDataUninitialized; message?: string }>;
  uninitializedText?: string;
  hideUninitialized?: boolean;
  loadingContent?: React.ComponentType<{ data: AsyncDataLoading }>;
  errorContent?: React.ComponentType<{ data: AsyncDataError }>;
} & Omit<C, 'data'>;

export const AsyncDataView = <T, C extends { data: T }>({
  data,
  uninitializedContent,
  uninitializedText,
  hideUninitialized,
  loadingContent,
  errorContent,
  renderer,
  ...rest
}: AsyncDataViewProps<T, C>) => {
  const Renderer = renderer as any;
  switch (data.type) {
    case 'uninitialized': {
      const UninitializedView = uninitializedContent ?? UninitializedRenderer;
      return hideUninitialized ? null : (
        <UninitializedView data={data} message={uninitializedText} />
      );
    }
    case 'loading': {
      const LoadingView = loadingContent ?? LoadingRenderer;
      return <LoadingView data={data} />;
    }
    case 'loaded':
      return <Renderer data={data.value} {...rest} />;
    case 'error': {
      const ErrorView = errorContent ?? ErrorRenderer;
      return <ErrorView data={data} />;
    }
    default:
      return null;
  }
};

const UninitializedRenderer: React.FC<{ data: AsyncDataUninitialized; message?: string }> = ({
  message,
}) => (
  <NoteView title="Ei tietoja" noMargin>
    {message ?? 'Tietoja ei ole alustettu'}
  </NoteView>
);

const LoadingRenderer: React.FC<{ data: AsyncDataLoading }> = () => (
  <NoteView title="Odota" noMargin>
    Ladataan...
  </NoteView>
);

const ErrorRenderer: React.FC<{ data: AsyncDataError }> = ({ data }) => {
  const error = data.error;
  const message = error instanceof Error ? error.message : String(error);
  const errorData =
    error && typeof error === 'object' && 'data' in error
      ? (error as { data: unknown }).data
      : null;
  return (
    <ErrorView title="Virhe tietojen latauksessa">
      <p>{message}</p>
      {errorData ? <Code block>{JSON.stringify(errorData, null, 2)}</Code> : undefined}
    </ErrorView>
  );
};
