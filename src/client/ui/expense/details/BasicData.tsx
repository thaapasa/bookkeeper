import * as React from 'react';
import styled from 'styled-components';

import { UserExpense } from 'shared/types/Expense';
import { Source } from 'shared/types/Session';

import { media } from '../../Styles';

interface BasicDataProps {
  expense: UserExpense;
  source: Source;
  fullCategoryName: string;
}

export const BasicData: React.FC<BasicDataProps> = ({
  expense,
  fullCategoryName,
  source,
}) => (
  <SmallDeviceContainer>
    <DetailRow name="Kohde" value={expense.receiver} />
    <DetailRow name="Kategoria" value={fullCategoryName} />
    <DetailRow name="Lähde" value={source.name} />
  </SmallDeviceContainer>
);

const DetailRow: React.FC<{ name: string; value: string }> = ({
  name,
  value,
}) => (
  <DetailRowContainer>
    <DetailLabel>{name + ':'}</DetailLabel>
    {value}
  </DetailRowContainer>
);

const SmallDeviceContainer = styled.div`
  display: none;
  padding: 8px 16px;

  ${media.mobilePortrait`
    display: block;
  `}
`;

const DetailRowContainer = styled.div`
  padding: 4px 0;
`;

const DetailLabel = styled.div`
  display: inline-block;
  width: 80px;
`;
