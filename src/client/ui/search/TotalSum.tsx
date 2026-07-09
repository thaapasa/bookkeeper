import { Group, GroupProps, Text } from '@mantine/core';
import * as React from 'react';

import { Money } from 'shared/util';

import { SectionLabel } from '../design/Text';

type TotalSumProps = { label: string; sum: Money } & Omit<GroupProps, 'children'>;

/** Labeled money total for search summary rows. */
export const TotalSum: React.FC<TotalSumProps> = ({ label, sum, ...props }) => (
  <Group gap="xs" wrap="nowrap" align="flex-end" {...props}>
    <SectionLabel component="span">{label}</SectionLabel>
    <Text component="span" fz="sm">
      {sum.format()}
    </Text>
  </Group>
);
