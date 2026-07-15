import { Group, GroupProps } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { readableTimestamp, toDateTime } from 'shared/time';
import { useUserMap } from 'client/data/SessionStore';
import { Caption } from 'client/ui/design/Text';

type AuditInfoProps = {
  expense: UserExpense;
} & GroupProps;

/** Creation/modification audit trail: who recorded the expense and when it was last edited */
export const AuditInfo: React.FC<AuditInfoProps> = ({ expense, ...props }) => {
  const userMap = useUserMap();
  const creator = userMap?.[expense.createdById]?.firstName ?? '?';
  const edited = toDateTime(expense.updated) > toDateTime(expense.created);
  return (
    <Group gap="md" {...props}>
      <Caption fz="sm">
        Kirjannut {creator} {readableTimestamp(expense.created)}
      </Caption>
      {edited ? <Caption fz="sm">Muokattu {readableTimestamp(expense.updated)}</Caption> : null}
    </Group>
  );
};
