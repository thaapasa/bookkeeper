import { styled } from '@mui/material';
import * as React from 'react';

import { colorScheme } from 'client/ui/Colors';

import { AllColumns, Row } from './ExpenseTableLayout';

export const WeekHeaderRow: React.FC<{ week: string }> = ({ week }) => (
  <Row>
    <WeekData>Viikko {week}</WeekData>
  </Row>
);

const WeekData = styled(AllColumns)`
  padding: 16px 4px 8px 4px;
  color: ${colorScheme.secondary.dark};
  height: inherit;
  font-weight: bold;
  font-size: 11pt;
  font-style: italic;
  background-color: ${colorScheme.gray.light};
`;
