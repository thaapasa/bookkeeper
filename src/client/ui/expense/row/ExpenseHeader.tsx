import { Table } from '@mantine/core';
import * as React from 'react';

import { useIsMobile } from '../../hooks/useBreakpoints';
import {
  BalanceVisibleFrom,
  CategoryVisibleFrom,
  ReceiverVisibleFrom,
  SourceVisibleFrom,
} from './ExpenseTableColumns';

export function ExpenseHeader() {
  const isMobile = useIsMobile();
  return (
    <Table.Tr>
      <Table.Th w={isMobile ? 56 : 92} px="sm">
        Pvm
      </Table.Th>
      <Table.Th w={50} />
      <Table.Th>Nimi</Table.Th>
      <Table.Th ta="right" w={100}>
        Summa
      </Table.Th>
      <Table.Th className={ReceiverVisibleFrom}>Kohde</Table.Th>
      <Table.Th className={CategoryVisibleFrom}>Kategoria</Table.Th>
      <Table.Th w={66} className={SourceVisibleFrom}>
        Lähde
      </Table.Th>
      <Table.Th ta="right" w={100} className={BalanceVisibleFrom}>
        Balanssi
      </Table.Th>
      <Table.Th ta="right" w={isMobile ? 44 : 130} />
    </Table.Tr>
  );
}
