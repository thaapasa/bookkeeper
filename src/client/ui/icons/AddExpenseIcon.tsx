import { styled } from '@mui/material';
import * as React from 'react';

import { createExpense } from '../../data/State';
import { secondaryColors } from '../Colors';
import { Icons } from './Icons';

export const AddExpenseIcon: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <AddExpenseIconContainer>
    <BlackContent />
    <PlusIcon onClick={onClick ?? createExpense} />
  </AddExpenseIconContainer>
);

export const AddExpenseNavButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <AddExpenseIconContainer className="navigation">
    <BlackContent />
    <PlusIcon onClick={onClick ?? createExpense} className="navigation" />
  </AddExpenseIconContainer>
);

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

  cursor: pointer;
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
