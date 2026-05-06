import { Table } from '@mantine/core';
import * as React from 'react';

import { useIsMobile } from '../../hooks/useBreakpoints';
import styles from './ExpenseRow.module.css';
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
      <Table.Th w={isMobile ? 46 : 92}>Pvm</Table.Th>
      <Table.Th w={isMobile ? 40 : 52} />
      <Table.Th>Nimi</Table.Th>
      <Table.Th ta="right" w={100}>
        Summa
      </Table.Th>
      <Table.Th w={66} className={SourceVisibleFrom}>
        Lähde
      </Table.Th>
      <Table.Th className={ReceiverVisibleFrom}>Kohde</Table.Th>
      <Table.Th className={CategoryVisibleFrom}>Kategoria</Table.Th>
      <Table.Th ta="right" w={100} className={BalanceVisibleFrom}>
        Balanssi
      </Table.Th>
      <Table.Th ta="right" className={styles.toolsColumn} />
    </Table.Tr>
  );
}
