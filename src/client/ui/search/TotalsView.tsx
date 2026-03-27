import styled from '@emotion/styled';
import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';

import { neutral } from '../Colors';
import { SectionLabel } from '../design/Text';
import { mainContentMaxWidth } from '../layout/Styles.ts';

interface TotalsViewProps {
  results: UserExpense[];
}

export const TotalsView: React.FC<TotalsViewProps> = ({ results }) => {
  const totals = calculateTotals(results);
  return (
    <>
      <TotalsPadding />
      <TotalsPositioner>
        <TotalsArea>
          <Total>
            <SectionLabel component="span" mr={12}>
              Yhteensä
            </SectionLabel>
            {totals.total.format()}
          </Total>
          <Total>
            <SectionLabel component="span" mr={12}>
              Tulot
            </SectionLabel>
            {totals.income.format()}
          </Total>
          <Total>
            <SectionLabel component="span" mr={12}>
              Menot
            </SectionLabel>
            {totals.expense.format()}
          </Total>
          <Total>
            <SectionLabel component="span" mr={12}>
              Siirrot
            </SectionLabel>
            {totals.transfer.format()}
          </Total>
        </TotalsArea>
      </TotalsPositioner>
    </>
  );
};

const totalAreaSize = 48;

const TotalsPadding = styled.div`
  height: ${totalAreaSize + 16}px;
`;

const TotalsPositioner = styled.div`
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

  @media screen and (max-width: 52.4375em) {
    left: 0;
    right: 0;
    bottom: 0;
  }

  @media screen and (min-width: 87.5em) {
    justify-content: center;
  }
`;

const TotalsArea = styled.div`
  height: ${totalAreaSize}px;
  background-color: white;
  border-top: 1px solid ${neutral[3]};
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  flex: 1;

  @media screen and (min-width: 87.5em) {
    flex: none;
    width: ${mainContentMaxWidth}px;
  }
`;

const Total = styled.div`
  margin-left: 32px;
`;
