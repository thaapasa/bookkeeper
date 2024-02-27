import * as React from 'react';

import {
  AsyncData,
  AsyncDataError,
  AsyncDataLoading,
  AsyncDataUninitialized,
} from 'client/data/AsyncData';

import { ErrorView } from '../general/ErrorView';
import { NoteView } from '../general/NoteView';
import { Pre } from '../Styles';

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
      const UninitializedView = uninitializedContent ?? UnitializedRenderer;
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

const UnitializedRenderer: React.FC<{ data: AsyncDataUninitialized; message?: string }> = ({
  message,
}) => (
  <NoteView title="Ei tietoja" className="nomargin">
    {message ?? 'Tietoja ei ole alustettu'}
  </NoteView>
);

const LoadingRenderer: React.FC<{ data: AsyncDataLoading }> = () => (
  <NoteView title="Odota" className="nomargin">
    Ladataan...
  </NoteView>
);

const ErrorRenderer: React.FC<{ data: AsyncDataError }> = ({ data }) => (
  <ErrorView title="Virhe tietojen latauksessa">
    <p>{data.error.message}</p>
    {'data' in data.error ? <Pre>{JSON.stringify(data.error.data, null, 2)}</Pre> : undefined}
  </ErrorView>
);
