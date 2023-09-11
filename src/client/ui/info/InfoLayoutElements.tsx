import { styled } from '@mui/material';
import * as React from 'react';

import { primaryColors, secondaryColors } from '../Colors';
import { styled } from '@mui/material';

export const ItemView = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 4px 0;
`;

export const IdView = styled('div')`
  padding: 4px 8px;
  background-color: ${secondaryColors.light};
  color: ${secondaryColors.text};
  margin-right: 6px;
  border-radius: 8px;
`;

export const InfoItem = styled('div')`
  display: flex;
  flex-direction: row;
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid ${primaryColors.dark};
  &:last-of-type {
    border: none;
  }
`;

export const Label = styled('div')`
  width: 150px;
  margin: 8px 0;
`;

export const Value = styled('div')`
  flex-direction: column;
`;

export const SubValue = styled(Value)`
  margin-left: 16px;
  display: flex;
`;

export const ItemWithId = (props: { id: string | number; children: any }) => (
  <ItemView>
    <IdView>{props.id}</IdView>
    {props.children}
  </ItemView>
);
