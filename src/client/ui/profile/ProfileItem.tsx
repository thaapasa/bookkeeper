import styled from '@emotion/styled';
import { Text } from '@mantine/core';
import React from 'react';

export const ProfileItem: React.FC<
  React.PropsWithChildren<{ title?: string; labelFor?: string }>
> = ({ title, children, labelFor }) => (
  <>
    <LabelCell>
      <Text component="label" htmlFor={labelFor}>
        {title}
      </Text>
    </LabelCell>
    <DataCell>{children}</DataCell>
  </>
);

const LabelCell = styled.div`
  display: flex;
  align-items: center;
`;

const DataCell = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;
