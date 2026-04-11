import { Button, Group, Stack } from '@mantine/core';
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
  <Stack gap="md" p="md">
    <ErrorView title="Virhe tietojen latauksessa">{String(error)}</ErrorView>
    <Group>
      <Button leftSection={<Icons.Refresh />} onClick={resetErrorBoundary} variant="light">
        Yritä uudelleen
      </Button>
    </Group>
  </Stack>
);
