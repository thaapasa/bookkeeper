import { Box, Center, Loader, Table } from '@mantine/core';
import * as React from 'react';

import { AllColumns } from './Breakpoints.tsx';

/* Special rows */

export const RecurringExpenseSeparator: React.FC = () => (
  <Table.Tr>
    <AllColumns py={0} style={{ backgroundColor: 'var(--mantine-color-neutral-1)', height: 24 }} />
  </Table.Tr>
);

export const LoadingIndicator: React.FC<{ forRow?: boolean }> = ({ forRow }) => (
  <Table.Tr>
    <AllColumns>
      {forRow ? (
        <Center h={30}>
          <Loader size={30} />
        </Center>
      ) : (
        <Box pos="absolute" left="50%" top="50%">
          <Loader size={60} />
        </Box>
      )}
    </AllColumns>
  </Table.Tr>
);
