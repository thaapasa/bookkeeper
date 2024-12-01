import { styled } from '@mui/material';
import * as React from 'react';
import { NavigateFunction, useNavigate } from 'react-router';

import { uri } from 'shared/net';
import { toDayjs, toISODate, TypedDateRange } from 'shared/time';
import { createExpense, navigationP } from 'client/data/State';
import { newExpenseSuffix } from 'client/util/Links';

import { secondaryColors } from '../Colors';
import { connect } from '../component/BaconConnect';
import { pageSupportsRoutedExpenseDialog } from '../expense/NewExpenseInfo';
import { Icons } from './Icons';

export const AddExpenseIcon: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <AddExpenseIconContainer>
    <BlackContent />
    <PlusIcon onClick={onClick} />
  </AddExpenseIconContainer>
);

const AddExpenseNavButtonImpl: React.FC<{ onClick?: () => void; dateRange: TypedDateRange }> = ({
  onClick,
  dateRange,
}) => {
  const navigate = useNavigate();
  return (
    <AddExpenseIconContainer className="navigation">
      <BlackContent />
      <PlusIcon
        onClick={onClick ?? (() => openNewExpenseDialog(navigate, dateRange.start))}
        className="navigation"
      />
    </AddExpenseIconContainer>
  );
};

export const AddExpenseNavButton = connect(navigationP.map(n => ({ dateRange: n.dateRange })))(
  AddExpenseNavButtonImpl,
);

function openNewExpenseDialog(navigate: NavigateFunction, shownDay: Date) {
  const path = window.location.pathname;
  const refDay = toDayjs(shownDay);
  // Defined date if shown day is in another month. For same month, leave the date out
  const date = refDay.isSame(new Date(), 'month') ? undefined : refDay;
  if (pageSupportsRoutedExpenseDialog(path)) {
    if (!path.includes(newExpenseSuffix)) {
      const dateSuffix = date ? uri`?date=${toISODate(date)}` : '';
      navigate(
        path.startsWith('/p')
          ? path + newExpenseSuffix + dateSuffix
          : '/p' + newExpenseSuffix + dateSuffix,
      );
    }
  } else {
    createExpense({ date });
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
