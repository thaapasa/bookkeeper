import { Table, Text } from '@mantine/core';
import React from 'react';

import { StatementRowData } from 'shared/statement';
import { readableDateWithYear } from 'shared/time';
import { Money } from 'shared/util';

interface StatementRowsTableProps {
  rows: StatementRowData[];
  /** Extra rows rendered after the data rows (e.g. a "…and N more" note). */
  children?: React.ReactNode;
}

/** Table of statement rows, shared by the upload preview and the row list. */
export const StatementRowsTable: React.FC<StatementRowsTableProps> = ({ rows, children }) => (
  <Table.ScrollContainer minWidth={560}>
    <Table verticalSpacing="xs" highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={100}>Päivä</Table.Th>
          <Table.Th>Saaja/Maksaja</Table.Th>
          <Table.Th visibleFrom="sm">Viesti</Table.Th>
          <Table.Th w={120} visibleFrom="sm">
            Tyyppi
          </Table.Th>
          <Table.Th w={100} ta="right">
            Summa
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row, i) => (
          <Table.Tr key={i}>
            <Table.Td>
              <Text fz="sm" style={{ whiteSpace: 'nowrap' }}>
                {readableDateWithYear(row.bookingDate)}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text fz="sm" truncate>
                {row.counterparty ?? '–'}
              </Text>
            </Table.Td>
            <Table.Td visibleFrom="sm">
              <Text fz="sm" c="dimmed" truncate maw={280}>
                {row.message ?? row.reference ?? ''}
              </Text>
            </Table.Td>
            <Table.Td visibleFrom="sm">
              <Text fz="sm" c="dimmed">
                {row.type}
              </Text>
            </Table.Td>
            <Table.Td ta="right">
              <Text fz="sm" fw={600} c={row.amount.startsWith('-') ? undefined : 'green.8'}>
                {Money.from(row.amount).format()}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
        {children}
      </Table.Tbody>
    </Table>
  </Table.ScrollContainer>
);
