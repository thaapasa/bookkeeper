import { Badge, Box, BoxProps, Group, Text } from '@mantine/core';
import * as React from 'react';

import { effectiveStatementDate, StatementRow } from 'shared/statement';
import { readableDateWithYear } from 'shared/time';
import { Money } from 'shared/util';

type StatementMatchInfoProps = {
  rows: StatementRow[];
} & BoxProps;

/**
 * Bank statement rows matched to the expense (Täsmäytys). Rendered in the
 * expense details view when the expense has matches.
 */
export const StatementMatchInfo: React.FC<StatementMatchInfoProps> = ({ rows, ...props }) => {
  if (rows.length < 1) {
    return null;
  }
  return (
    <Box {...props}>
      <Group gap="xs" mb={4}>
        <Badge size="xs" variant="light" color="green" radius="sm">
          Täsmätty
        </Badge>
        <Text fz="xs" c="dimmed">
          Tiliotteen tapahtumat
        </Text>
      </Group>
      {rows.map(row => (
        <Group key={row.id} gap="sm" wrap="nowrap" py={2}>
          <Text fz="sm" c="dimmed" w={80} style={{ whiteSpace: 'nowrap' }}>
            {readableDateWithYear(effectiveStatementDate(row))}
          </Text>
          <Text fz="sm" truncate flex={1}>
            {row.counterparty ?? row.type}
          </Text>
          <Text fz="sm" fw={600} ta="right" style={{ whiteSpace: 'nowrap' }}>
            {Money.from(row.amount).format()}
          </Text>
        </Group>
      ))}
    </Box>
  );
};
