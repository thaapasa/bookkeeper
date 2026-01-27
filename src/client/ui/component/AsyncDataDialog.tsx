import { CircularProgress, DialogContent, DialogTitle } from '@mui/material';
import { styled } from '@mui/system';
import * as React from 'react';

import { AsyncDataError, AsyncDataLoading } from 'client/data/AsyncData';

import { Pre } from '../Styles';
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
  <DialogContent>
    <LoaderArea>
      <CircularProgress size={64} />
    </LoaderArea>
  </DialogContent>
);

const ErrorRenderer: React.FC<{ data: AsyncDataError }> = ({ data }) => {
  const error = data.error;
  const message = error instanceof Error ? error.message : String(error);
  const errorData =
    error && typeof error === 'object' && 'data' in error
      ? (error as { data: unknown }).data
      : null;
  return (
    <DialogContent>
      <DialogTitle color="primary">Virhe tietojen latauksessa</DialogTitle>
      <DialogContent>
        <p>{message}</p>
        {errorData ? <Pre>{JSON.stringify(errorData, null, 2)}</Pre> : undefined}
      </DialogContent>
    </DialogContent>
  );
};

const LoaderArea = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
`;
