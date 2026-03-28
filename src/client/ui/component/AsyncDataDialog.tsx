import styled from '@emotion/styled';
import { Loader } from '@mantine/core';
import * as React from 'react';

import { AsyncDataError, AsyncDataLoading } from 'client/data/AsyncData';

import { Pre } from '../GlobalStyles';
import { AsyncDataView, AsyncDataViewProps } from './AsyncDataView';

export const AsyncDataDialogContent = <T, C extends { data: T }>({
  loadingContent,
  errorContent,
  hideUninitialized,
  renderer,
  ...rest
}: AsyncDataViewProps<T, C>) => (
  <AsyncDataView
    loadingContent={loadingContent ?? LoadingRenderer}
    errorContent={errorContent ?? ErrorRenderer}
    hideUninitialized={hideUninitialized ?? true}
    renderer={renderer as any}
    {...rest}
  />
);

const LoadingRenderer: React.FC<{ data: AsyncDataLoading }> = () => (
  <LoaderArea>
    <Loader size={64} />
  </LoaderArea>
);

const ErrorRenderer: React.FC<{ data: AsyncDataError }> = ({ data }) => {
  const error = data.error;
  const message = error instanceof Error ? error.message : String(error);
  const errorData =
    error && typeof error === 'object' && 'data' in error
      ? (error as { data: unknown }).data
      : null;
  return (
    <div>
      <ErrorTitle>Virhe tietojen latauksessa</ErrorTitle>
      <p>{message}</p>
      {errorData ? <Pre>{JSON.stringify(errorData, null, 2)}</Pre> : undefined}
    </div>
  );
};

const LoaderArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 8px;
`;
