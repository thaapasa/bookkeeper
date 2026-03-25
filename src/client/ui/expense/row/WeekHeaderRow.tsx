import { Text } from '@mantine/core';
import * as React from 'react';

import { Row } from './ColumnComponents';
import { AllColumns } from './SpecialRows';

export const WeekHeaderRow: React.FC<{ week: string }> = ({ week }) => (
  <Row>
    <AllColumns
      style={{
        padding: '16px 4px 8px 4px',
        fontStyle: 'italic',
        backgroundColor: 'var(--mantine-color-neutral-1)',
        color: 'var(--mantine-color-primary-7)',
      }}
    >
      <Text span fz="md" fw={700}>
        Viikko {week}
      </Text>
    </AllColumns>
  </Row>
);
