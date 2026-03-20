import styled from '@emotion/styled';
import { Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Money } from 'shared/util';

export const SplitHeader: React.FC<{ expense: UserExpense }> = ({ expense }) => {
  return (
    <Header>
      <HeaderRow>
        <div>
          <h5 style={{ margin: 0, fontWeight: 500 }}>{expense.title}</h5>
        </div>
        <Text fz="lg" fw={500} pl="md">
          {Money.from(expense.sum).format()}
        </Text>
      </HeaderRow>
      <Text fz="sm" c="dimmed">
        Pilko kirjaus osiin
      </Text>
    </Header>
  );
};

const Header = styled.div`
  padding-bottom: 16px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
`;
