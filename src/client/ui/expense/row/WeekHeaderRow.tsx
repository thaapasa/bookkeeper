import { Table, Text } from '@mantine/core';
import * as React from 'react';

import { AllColumns } from './ExpenseTableColumns';

export const WeekHeaderRow: React.FC<{ week: string }> = ({ week }) => (
  <Table.Tr>
    <AllColumns bg="surface.1" c="primary.7">
      <Text fz="md" fw={700} px="md" fs="italic">
        Viikko {week}
      </Text>
    </AllColumns>
  </Table.Tr>
);
