import styled from '@emotion/styled';
import { Text } from '@mantine/core';
import * as React from 'react';

import { neutral, primary } from 'client/ui/Colors';

import { AllColumns, Row } from './ExpenseTableLayout';

export const WeekHeaderRow: React.FC<{ week: string }> = ({ week }) => (
  <Row>
    <WeekData>
      <Text span fz="xs" fw={700}>
        Viikko {week}
      </Text>
    </WeekData>
  </Row>
);

const WeekData = styled(AllColumns)`
  padding: 16px 4px 8px 4px;
  color: ${primary[7]};
  height: inherit;
  font-style: italic;
  background-color: ${neutral[1]};
`;
