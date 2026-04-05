import { Table, TableTdProps } from '@mantine/core';
import * as React from 'react';

import { Category } from 'shared/types';

import { AddCategoryButton } from './CategoryTools';

export const CategoryTableLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Table withRowBorders={false} withTableBorder={false} verticalSpacing="xs" fz="sm" layout="fixed">
    {children}
  </Table>
);

export const AllColumns: React.FC<React.PropsWithChildren<TableTdProps>> = props => (
  <Table.Td colSpan={4} {...props} />
);

export const CategoryHeader: React.FC<{ onAdd: (p?: Category) => void }> = ({ onAdd }) => (
  <Table.Tr bg="neutral.1">
    <Table.Th fw={700} pl="md">
      Nimi
    </Table.Th>
    <Table.Th fw={700} ta="right" w={75}>
      Tulot
    </Table.Th>
    <Table.Th fw={700} ta="right" w={75}>
      Kulut
    </Table.Th>
    <Table.Th w={70} ta="right" pr="sm">
      <AddCategoryButton onAdd={onAdd} color="neutral.7" icon="PlusCircle" />
    </Table.Th>
  </Table.Tr>
);
