import { styled } from '@mui/material';
import * as React from 'react';

import { createExpense } from '../../data/State';
import { secondaryColors } from '../Colors';
import { Icons } from './Icons';

export function AddExpenseIcon() {
  return (
    <AddExpenseIconContainer>
      <BlackContent />
      <PlusIcon onClick={createExpense} />
    </AddExpenseIconContainer>
  );
}

export function AddExpenseNavButton() {
  return (
    <AddExpenseIconContainer className="navigation">
      <BlackContent />
      <PlusIcon onClick={createExpense} className="navigation" />
    </AddExpenseIconContainer>
  );
}

const PlusIcon = styled(Icons.PlusCircle)`
  position: absolute;
  top: 0;
  left: 0;

  width: 32px;
  height: 32px;
  color: ${secondaryColors.standard};

  &.navigation {
    width: 40px;
    height: 40px;
    z-index: 1;
  }
`;

const AddExpenseIconContainer = styled('div')`
  position: relative;

  width: 32px;
  height: 32px;

  &.navigation {
    width: 40px;
    height: 40px;
  }
`;

const BlackContent = styled('div')`
  position: absolute;
  top: 5px;
  right: 5px;
  bottom: 5px;
  left: 5px;
  border-radius: 100px;
  background: black;
  z-index: 0;
`;
