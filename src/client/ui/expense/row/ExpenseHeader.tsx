import { Table } from '@mantine/core';
import * as React from 'react';

import classes from './ExpenseRow.module.css';
import { sourceWidth } from './ExpenseTableLayout';

export function ExpenseHeader() {
  return (
    <Table.Tr>
      <Table.Th ta="right" className={classes.colDate}>
        Pvm
      </Table.Th>
      <Table.Th px="xs" w={48} />
      <Table.Th pl={4}>Nimi</Table.Th>
      <Table.Th visibleFrom="xs">Kohde</Table.Th>
      <Table.Th visibleFrom="xs">Kategoria</Table.Th>
      <Table.Th p={4} w={sourceWidth + 16} visibleFrom="sm">
        Lähde
      </Table.Th>
      <Table.Th ta="right" pr="xs" w={100}>
        Summa
      </Table.Th>
      <Table.Th ta="right" pr="xs" w={80} visibleFrom="sm">
        Balanssi
      </Table.Th>
      <Table.Th ta="right" className={classes.colTools} />
    </Table.Tr>
  );
}
