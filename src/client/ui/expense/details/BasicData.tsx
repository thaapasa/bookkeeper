import { Box, Stack, StackProps, Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { sourceDisplayName } from 'shared/source';
import { Source } from 'shared/types';
import { useValidSession } from 'client/data/SessionStore';

type BasicDataProps = {
  expense: UserExpense;
  source: Source;
  fullCategoryName: string;
} & StackProps;

export const BasicData: React.FC<BasicDataProps> = ({
  expense,
  fullCategoryName,
  source,
  ...props
}) => {
  const ownUserId = useValidSession().user.id;
  return (
    <Stack gap={0} {...props}>
      <DetailRow name="Kohde" value={expense.receiver} />
      <DetailRow name="Kategoria" value={fullCategoryName} />
      <DetailRow name="Lähde" value={sourceDisplayName(source, ownUserId)} />
    </Stack>
  );
};

const DetailRow: React.FC<{ name: string; value: string }> = ({ name, value }) => (
  <Box py={4}>
    <Text display="inline-block" w={88} fz="sm">
      {name + ':'}
    </Text>
    {value}
  </Box>
);
