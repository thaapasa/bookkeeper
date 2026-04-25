import { Button, Group, GroupProps } from '@mantine/core';
import * as React from 'react';

import { isDefined } from 'shared/types';
import { Icons } from 'client/ui/icons/Icons';

import { SplitTools } from './ExpenseSplit.hooks';

export const SplitButtons: React.FC<
  {
    addRow: SplitTools['addRow'];
    onClose: () => void;
    splitExpense: (() => void) | undefined;
    saving?: boolean;
  } & GroupProps
> = ({ addRow, onClose, splitExpense, saving, ...props }) => (
  <Group justify="space-between" w="100%" {...props}>
    <Button
      leftSection={<Icons.Add />}
      variant="filled"
      color="neutral"
      onClick={addRow}
      disabled={saving}
    >
      Lisää rivi
    </Button>
    <Button leftSection={<Icons.Cancel />} variant="outline" onClick={onClose} disabled={saving}>
      Peruuta
    </Button>
    <Button
      leftSection={<Icons.Split />}
      variant="filled"
      disabled={!isDefined(splitExpense)}
      loading={saving}
      onClick={splitExpense}
    >
      Pilko
    </Button>
  </Group>
);
