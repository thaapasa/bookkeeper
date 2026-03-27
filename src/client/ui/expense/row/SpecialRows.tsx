import { Box, Center, Loader, Table, TableTdProps } from '@mantine/core';
import * as React from 'react';

import { useIsMobile, useIsMobilePortrait } from 'client/ui/hooks/useBreakpoints';

import { Row } from './ColumnComponents';

/* AllColumns — spans all visible columns */

function useColumnCount(): number {
  const isMobile = useIsMobile();
  const isMobilePortrait = useIsMobilePortrait();
  if (isMobilePortrait) return 5;
  if (isMobile) return 7;
  return 9;
}

export const AllColumns: React.FC<TableTdProps> = props => {
  const colSpan = useColumnCount();
  return <Table.Td colSpan={colSpan} {...props} />;
};

/* Special rows */

export const RecurringExpenseSeparator: React.FC = () => (
  <Row>
    <AllColumns style={{ backgroundColor: 'var(--mantine-color-neutral-1)', height: 24 }} />
  </Row>
);

export const LoadingIndicator: React.FC<{ forRow?: boolean }> = ({ forRow }) => (
  <Row>
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
  </Row>
);
