import { styled } from '@mui/material';
import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';

import { gray, secondaryColors } from '../Colors';
import { mainContentMaxWidth, media } from '../Styles';

interface TotalsViewProps {
  results: UserExpense[];
}

export class TotalsView extends React.Component<TotalsViewProps> {
  render() {
    const totals = calculateTotals(this.props.results);
    return (
      <>
        <TotalsPadding />
        <TotalsPositioner>
          <TotalsArea>
            <Total>
              <Label>Yhteensä</Label>
              {totals.total.format()}
            </Total>
            <Total>
              <Label>Tulot</Label>
              {totals.income.format()}
            </Total>
            <Total>
              <Label>Menot</Label>
              {totals.expense.format()}
            </Total>
            <Total>
              <Label>Siirrot</Label>
              {totals.transfer.format()}
            </Total>
          </TotalsArea>
        </TotalsPositioner>
      </>
    );
  }
}

const totalAreaSize = 48;

const TotalsPadding = styled('div')`
  height: ${totalAreaSize + 16}px;
`;

const TotalsPositioner = styled('div')`
  position: fixed;
  z-index: 1;
  left: 32px;
  right: 32px;
  bottom: 32px;
  height: ${totalAreaSize}px;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  ${media.mobile`
    left: 0;
    right: 0;
    bottom: 0;
  `}

  ${media.largeDevice`
    justify-content: center;
  `}
`;

const TotalsArea = styled('div')`
  height: ${totalAreaSize}px;
  background-color: white;
  border-top: 1px solid ${gray.standard};
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  flex: 1;

  ${media.largeDevice`
    flex: none;
    width: ${mainContentMaxWidth}px;
  `}
`;

const Label = styled('span')`
  margin-right: 12px;
  color: ${secondaryColors.dark};
  font-weight: bold;
`;

const Total = styled('div')`
  margin-left: 32px;
`;
