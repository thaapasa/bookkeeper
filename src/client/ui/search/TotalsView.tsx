import { styled } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Money } from 'shared/util';

import { gray, secondaryColors } from '../Colors';
import { mainContentMaxWidth, media } from '../Styles';
import { styled } from '@mui/material';

interface TotalsViewProps {
  results: UserExpense[];
}

export class TotalsView extends React.Component<TotalsViewProps> {
  render() {
    const sum = this.props.results.reduce((p, c) => p.plus(c.sum), Money.from(0));
    const income = this.props.results.filter(r => r.type === 'income').reduce((p, c) => p.plus(c.sum), Money.from(0));
    const cost = this.props.results.filter(r => r.type === 'expense').reduce((p, c) => p.plus(c.sum), Money.from(0));
    return (
      <>
        <TotalsPadding />
        <TotalsPositioner>
          <TotalsArea>
            <Total>
              <Label>Yhteensä</Label>
              {sum.format()}
            </Total>
            <Total>
              <Label>Tulot</Label>
              {income.format()}
            </Total>
            <Total>
              <Label>Menot</Label>
              {cost.format()}
            </Total>
          </TotalsArea>
        </TotalsPositioner>
      </>
    );
  }
}

const totalAreaSize = 48;

const TotalsPadding = styled('div')`
  height: ${totalAreaSize}px;
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
