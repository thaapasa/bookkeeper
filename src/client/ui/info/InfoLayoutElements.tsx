import { Badge, Group, Paper, Stack } from '@mantine/core';
import * as React from 'react';

import { Caption, Subtitle } from '../design/Text';

/**
 * A titled block of information. Sections stack down the info page, with an optional
 * action (a refresh button, say) aligned to the right of the heading.
 */
export const InfoSection: React.FC<
  React.PropsWithChildren<{
    title: string;
    caption?: React.ReactNode;
    action?: React.ReactNode;
  }>
> = ({ title, caption, action, children }) => (
  <Paper withBorder radius="md" p="md" bg="surface.0">
    <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
      <Stack gap={2}>
        <Subtitle order={3} noBorder mb={0}>
          {title}
        </Subtitle>
        {caption ? <Caption>{caption}</Caption> : null}
      </Stack>
      {action}
    </Group>
    {children}
  </Paper>
);

/** The database id of a row, shown as a compact chip in the leading table column */
export const IdBadge: React.FC<{ id: number }> = ({ id }) => (
  <Badge variant="light" color="primary" radius="md" px="xs">
    {id}
  </Badge>
);
