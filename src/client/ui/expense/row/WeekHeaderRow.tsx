import { colorScheme } from 'client/ui/Colors';
import { media } from 'client/ui/Styles';
import * as React from 'react';
import styled from 'styled-components';
import { AllColumns, Row } from './ExpenseTableLayout';

export const WeekHeaderRow: React.FC<{ week: string }> = ({ week }) => (
  <WeekRow>
    <WeekData>Viikko {week}</WeekData>
  </WeekRow>
);

const WeekRow = styled(Row)`
  ${media.mobile`
    display: none;
  `}
`;

const WeekData = styled(AllColumns)`
  padding: 16px 4px 8px 4px;
  color: ${colorScheme.secondary.dark};
  height: inherit;
  font-weight: bold;
  font-size: 11pt;
  font-style: italic;
  background-color: ${colorScheme.gray.light};
`;
