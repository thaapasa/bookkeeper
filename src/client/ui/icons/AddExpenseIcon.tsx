import { styled } from '@mui/material';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { createExpense } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { secondaryColors } from '../Colors';
import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';
import { Icons } from './Icons';

export const AddExpenseIcon: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <AddExpenseIconContainer>
    <BlackContent />
    <PlusIcon onClick={onClick} />
  </AddExpenseIconContainer>
);

export const AddExpenseNavButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const navigate = useNavigate();
  return (
    <AddExpenseIconContainer className="navigation">
      <BlackContent />
      <PlusIcon
        onClick={onClick ?? (() => openNewExpenseDialog(navigate))}
        className="navigation"
      />
    </AddExpenseIconContainer>
  );
};

function openNewExpenseDialog(navigate: NavigateFunction) {
  const path = window.location.pathname;
  if (pageSupportsRoutedExpenseDialog(path)) {
    if (!path.includes(newExpenseSuffix)) {
      navigate(path.startsWith('/p') ? path + newExpenseSuffix : '/p' + newExpenseSuffix);
    }
  } else {
    createExpense();
  }
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
