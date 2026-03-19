import styled from '@emotion/styled';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Money } from 'shared/util';

export const SplitHeader: React.FC<{ expense: UserExpense }> = ({ expense }) => {
  return (
    <Header>
      <HeaderRow>
        <div>
          <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 500 }}>{expense.title}</h5>
        </div>
        <SumText>{Money.from(expense.sum).format()}</SumText>
      </HeaderRow>
      <SubText>Pilko kirjaus osiin</SubText>
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

const SumText = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  padding-left: 16px;
`;

const SubText = styled.div`
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
`;
