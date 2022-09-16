import * as React from 'react';
import styled from 'styled-components';

import { createExpense } from '../../data/State';
import { secondaryColors } from '../Colors';
import { Icons } from './Icons';

export function AddExpenseIcon(props: { className?: string }) {
  return (
    <AddExpenseIconContainer className={props.className}>
      <BlackContent />
      <PlusIcon onClick={createExpense} />
    </AddExpenseIconContainer>
  );
}

const PlusIcon = styled(Icons.PlusCircle)`
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  color: ${secondaryColors.standard};
  z-index: 1;
`;

const AddExpenseIconContainer = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
`;

const BlackContent = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  bottom: 5px;
  left: 5px;
  border-radius: 100px;
  background: black;
  z-index: 0;
`;
