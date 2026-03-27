import { Text } from '@mantine/core';
import * as React from 'react';

import { Row } from './ColumnComponents';
import { AllColumns } from './SpecialRows';

export const WeekHeaderRow: React.FC<{ week: string }> = ({ week }) => (
  <Row>
    <AllColumns bg="neutral.1" c="primary.7">
      <Text fz="md" fw={700} px="md" fs="italic">
        Viikko {week}
      </Text>
    </AllColumns>
  </Row>
);
