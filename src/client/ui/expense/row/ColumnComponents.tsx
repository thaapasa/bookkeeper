import { Table } from '@mantine/core';
import * as React from 'react';

import classes from './ExpenseRow.module.css';

const cx = (...cs: (string | undefined | null | false)[]) => cs.filter(Boolean).join(' ');

export interface ColumnProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  colSpan?: number;
}

export const Row = Table.Tr;

export const DateColumn: React.FC<ColumnProps> = props => (
  <Table.Td ta="right" pos="relative" className={cx(classes.colDate, props.className)} {...props} />
);

export const AvatarColumn: React.FC<ColumnProps> = props => (
  <Table.Td px="xs" pt={2} style={{ overflow: 'visible' }} {...props} />
);

export const NameColumn: React.FC<ColumnProps> = props => (
  <Table.Td pos="relative" pl={4} {...props} />
);

export const ReceiverColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td visibleFrom="xs" className={className} {...props} />
);

export const CategoryColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td visibleFrom="xs" className={className} {...props} />
);

export const SourceColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td p={4} visibleFrom="sm" className={className} {...props} />
);

export const SumColumn: React.FC<ColumnProps> = props => (
  <Table.Td ta="right" pr="xs" pos="relative" {...props} />
);

export const BalanceColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td ta="right" pr="xs" pos="relative" visibleFrom="sm" className={className} {...props} />
);

export const ToolColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td ta="right" className={cx(classes.colTools, className)} {...props} />
);
