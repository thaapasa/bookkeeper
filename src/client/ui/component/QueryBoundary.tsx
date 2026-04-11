import { Loader } from '@mantine/core';
import * as React from 'react';

import { ErrorBoundary } from './ErrorBoundary';
import { QueryErrorDisplay } from './QueryErrorDisplay';

type QueryBoundaryProps = {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  children: React.ReactNode;
};

export const QueryBoundary: React.FC<QueryBoundaryProps> = ({
  fallback,
  errorFallback,
  children,
}) => (
  <ErrorBoundary
    fallbackRender={({ error, resetErrorBoundary }) =>
      errorFallback ?? <QueryErrorDisplay error={error} resetErrorBoundary={resetErrorBoundary} />
    }
  >
    <React.Suspense fallback={fallback ?? <Loader />}>{children}</React.Suspense>
  </ErrorBoundary>
);
