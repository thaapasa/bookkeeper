import * as React from 'react';

import { AsyncData } from 'client/data/AsyncData';

import { ErrorView } from '../general/ErrorView';
import { NoteView } from '../general/NoteView';

type AsyncDataViewProps<T, C extends { data: T }> = {
  data: AsyncData<T>;
  renderer: React.ComponentType<C>;
  uninitializedText?: string;
  hideUninitialized?: boolean;
} & Omit<C, 'data'>;

export const AsyncDataView = <T, C extends { data: T }>({
  data,
  uninitializedText,
  hideUninitialized,
  renderer,
  ...rest
}: AsyncDataViewProps<T, C>) => {
  const Renderer = renderer as any;
  switch (data.type) {
    case 'uninitialized':
      return hideUninitialized ? null : (
        <NoteView title="Ei tietoja" className="nomargin">
          {uninitializedText ?? 'Tietoja ei ole alustettu'}
        </NoteView>
      );
    case 'loading':
      return (
        <NoteView title="Odota" className="nomargin">
          Ladataan...
        </NoteView>
      );
    case 'loaded':
      return <Renderer data={data.value} {...rest} />;
    case 'error':
      <ErrorView title="Virhe tietojen latauksessa">
        {data.error.message}
      </ErrorView>;
    default:
      return null;
  }
};
