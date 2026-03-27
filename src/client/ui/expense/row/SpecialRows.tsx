import { Box, Center, Loader, Table, TableTdProps } from '@mantine/core';
import * as React from 'react';

import { windowSizeP } from 'client/data/State';
import { connect } from 'client/ui/component/BaconConnect';
import { Size } from 'client/ui/layout/Styles.ts';

import { Row } from './ColumnComponents';
import { getVisibleColumns } from './columns';

/* AllColumns — spans all visible columns (uses BaconJS for responsive colspan) */

type AllColumnsProps = {
  size: Size;
} & TableTdProps;

const AllColumnsComponent: React.FC<AllColumnsProps> = ({ size, ...props }) => (
  <Table.Td colSpan={getVisibleColumns(size)} {...props} />
);

export const AllColumns = connect(windowSizeP.map(size => ({ size })))(AllColumnsComponent);

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
