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

const ErrorRenderer: React.FC<{ data: AsyncDataError }> = ({ data }) => (
  <DialogContent>
    <DialogTitle color="primary">Virhe tietojen latauksessa</DialogTitle>
    <DialogContent>
      <p>{data.error.message}</p>
      {'data' in data.error ? <Pre>{JSON.stringify(data.error.data, null, 2)}</Pre> : undefined}
    </DialogContent>
  </DialogContent>
);

const LoaderArea = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
`;
