import { Box, Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Source } from 'shared/types';

interface BasicDataProps {
  expense: UserExpense;
  source: Source;
  fullCategoryName: string;
}

export const BasicData: React.FC<BasicDataProps> = ({ expense, fullCategoryName, source }) => (
  <Box hiddenFrom="xs" px="md" py="xs">
    <DetailRow name="Kohde" value={expense.receiver} />
    <DetailRow name="Kategoria" value={fullCategoryName} />
    <DetailRow name="Lähde" value={source.name} />
  </Box>
);

const DetailRow: React.FC<{ name: string; value: string }> = ({ name, value }) => (
  <Box py={4}>
    <Text component="span" display="inline-block" w={80}>
      {name + ':'}
    </Text>
    {value}
  </Box>
);
