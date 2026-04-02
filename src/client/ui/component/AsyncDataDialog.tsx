import { Box, Loader, Text, Title } from '@mantine/core';
import * as React from 'react';

import { AsyncDataError, AsyncDataLoading } from 'client/data/AsyncData';

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
  <Box display="flex" style={{ alignItems: 'center', justifyContent: 'center' }} p="xl">
    <Loader size={64} />
  </Box>
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
      <Title order={3} mb="xs">
        Virhe tietojen latauksessa
      </Title>
      <Text>{message}</Text>
      {errorData ? (
        <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
          {JSON.stringify(errorData, null, 2)}
        </pre>
      ) : undefined}
    </div>
  );
};
