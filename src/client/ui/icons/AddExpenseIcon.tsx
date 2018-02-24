import * as React from 'react';
import styled from 'styled-components';
import { Map } from '../../../shared/util/Objects';
import { colorScheme } from '../Colors';
import { PlusCircle } from '../Icons';
import { createExpense } from '../../data/State';

export function AddExpenseIcon(props: { className?: string }) {
  return (
    <AddExpenseIconContainer className={props.className}>
      <BlackContent />
      <PlusCircle style={styles.addExpenseIcon} onClick={createExpense} />
    </AddExpenseIconContainer>
  );
}

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

const styles: Map<React.CSSProperties> = {
  addExpenseIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '40px',
    height: '40px',
    color: colorScheme.secondary.standard,
    zIndex: 1,
  },
};
