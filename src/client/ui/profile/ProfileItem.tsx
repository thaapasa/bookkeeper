import styled from '@emotion/styled';
import React from 'react';

import { Text } from '../design/Text';

export const ProfileItem: React.FC<
  React.PropsWithChildren<{ title?: string; labelFor?: string }>
> = ({ title, children, labelFor }) => (
  <>
    <LabelCell>
      <Label htmlFor={labelFor}>{title}</Label>
    </LabelCell>
    <DataCell>{children}</DataCell>
  </>
);

const Label = Text.withComponent('label');

const LabelCell = styled.div`
  display: flex;
  align-items: center;
`;

const DataCell = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;
