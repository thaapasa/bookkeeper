import { Table } from '@mantine/core';
import * as React from 'react';

const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export interface ColumnProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  colSpan?: number;
}

export const Row = Table.Tr;

export const DateColumn: React.FC<ColumnProps> = props => (
  <Table.Td ta="right" pos="relative" className={cx('col-date', props.className)} {...props} />
);

export const AvatarColumn: React.FC<ColumnProps> = props => (
  <Table.Td px={8} pt={2} style={{ overflow: 'visible' }} {...props} />
);

export const NameColumn: React.FC<ColumnProps> = props => (
  <Table.Td pos="relative" pl={4} {...props} />
);

export const ReceiverColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td className={cx('hide-on-mobile-portrait', className)} {...props} />
);

export const CategoryColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td className={cx('hide-on-mobile-portrait', className)} {...props} />
);

export const SourceColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td p={4} className={cx('hide-on-mobile', className)} {...props} />
);

export const SumColumn: React.FC<ColumnProps> = props => (
  <Table.Td ta="right" pr={8} pos="relative" {...props} />
);

export const BalanceColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td
    ta="right"
    pr={8}
    pos="relative"
    className={cx('hide-on-mobile', className)}
    {...props}
  />
);

export const ToolColumn: React.FC<ColumnProps> = ({ className, ...props }) => (
  <Table.Td ta="right" className={cx('col-tools', className)} {...props} />
);
