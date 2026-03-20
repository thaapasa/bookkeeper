import styled from '@emotion/styled';
import * as React from 'react';

import { neutral, primary } from '../Colors';

export const ItemView = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 4px 0;
`;

export const IdView = styled.div`
  padding: 4px 8px;
  background-color: ${primary[2]};
  color: ${primary[9]};
  margin-right: 6px;
  border-radius: var(--mantine-radius-md);
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid ${neutral[4]};
  &:last-of-type {
    border: none;
  }
`;

export const Label = styled.div`
  width: 150px;
  margin: 8px 0;
`;

export const Value = styled.div`
  flex-direction: column;
`;

export const SubValue = styled(Value)`
  margin-left: 16px;
  display: flex;
`;

export const ItemWithId: React.FC<{ id: string | number; children: any }> = props => (
  <ItemView>
    <IdView>{props.id}</IdView>
    {props.children}
  </ItemView>
);
