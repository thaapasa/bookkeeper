import { Button, Stack, Text } from '@mantine/core';
import * as React from 'react';

import { ErrorView } from '../general/ErrorView';
import { Icons } from '../icons/Icons';

type QueryErrorDisplayProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

export const QueryErrorDisplay: React.FC<QueryErrorDisplayProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <ErrorView title="Virhe tietojen latauksessa" m="lg">
    <Stack>
      <Text>{String(error)}</Text>
      <Button
        leftSection={<Icons.Refresh />}
        onClick={resetErrorBoundary}
        variant="light"
        w="fit-content"
      >
        Yritä uudelleen
      </Button>
    </Stack>
  </ErrorView>
);
