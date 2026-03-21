import { Table } from '@mantine/core';
import * as React from 'react';

import { sourceWidth } from './ExpenseTableLayout';

export function ExpenseHeader() {
  return (
    <Table.Tr>
      <Table.Th ta="right" className="col-date">
        Pvm
      </Table.Th>
      <Table.Th px={8} w={48} />
      <Table.Th pl={4}>Nimi</Table.Th>
      <Table.Th className="hide-on-mobile-portrait">Kohde</Table.Th>
      <Table.Th className="hide-on-mobile-portrait">Kategoria</Table.Th>
      <Table.Th p={4} w={sourceWidth + 16} className="hide-on-mobile">
        Lähde
      </Table.Th>
      <Table.Th ta="right" pr={8} w={100}>
        Summa
      </Table.Th>
      <Table.Th ta="right" pr={8} w={80} className="hide-on-mobile">
        Balanssi
      </Table.Th>
      <Table.Th ta="right" className="col-tools" />
    </Table.Tr>
  );
}
