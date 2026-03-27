import styled from '@emotion/styled';
import { Box, Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Source } from 'shared/types';
import { media } from 'client/ui/layout/Styles.ts';

interface BasicDataProps {
  expense: UserExpense;
  source: Source;
  fullCategoryName: string;
}

export const BasicData: React.FC<BasicDataProps> = ({ expense, fullCategoryName, source }) => (
  <SmallDeviceContainer>
    <DetailRow name="Kohde" value={expense.receiver} />
    <DetailRow name="Kategoria" value={fullCategoryName} />
    <DetailRow name="Lähde" value={source.name} />
  </SmallDeviceContainer>
);

const DetailRow: React.FC<{ name: string; value: string }> = ({ name, value }) => (
  <Box py={4}>
    <Text component="span" display="inline-block" w={80}>
      {name + ':'}
    </Text>
    {value}
  </Box>
);

const SmallDeviceContainer = styled.div`
  display: none;
  padding: 8px 16px;

  ${media.mobilePortrait`
    display: block;
  `}
`;
