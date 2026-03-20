import styled from '@emotion/styled';
import { Button } from '@mantine/core';
import * as React from 'react';

import { isDefined } from 'shared/types';
import { Icons } from 'client/ui/icons/Icons';

import { SplitTools } from './ExpenseSplit.hooks';

export const SplitButtons: React.FC<{
  addRow: SplitTools['addRow'];
  onClose: () => void;
  splitExpense: (() => void) | undefined;
}> = ({ addRow, onClose, splitExpense }) => (
  <ButtonGrid>
    <div style={{ justifySelf: 'start' }}>
      <Button leftSection={<Icons.Add />} variant="filled" color="gray" onClick={addRow}>
        Lisää rivi
      </Button>
    </div>
    <div style={{ justifySelf: 'center' }}>
      <Button leftSection={<Icons.Cancel />} variant="outline" onClick={onClose}>
        Peruuta
      </Button>
    </div>
    <div style={{ justifySelf: 'end' }}>
      <Button
        leftSection={<Icons.Split />}
        variant="filled"
        disabled={!isDefined(splitExpense)}
        onClick={splitExpense}
      >
        Pilko
      </Button>
    </div>
  </ButtonGrid>
);

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
`;
