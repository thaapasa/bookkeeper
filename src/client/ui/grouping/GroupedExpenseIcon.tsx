import styled from '@emotion/styled';
import { colors, getLuminance } from '@mui/material';
import * as React from 'react';

import { ExpenseGroupingRef } from 'shared/types';

import { Bookmark } from '../icons/Bookmark';

type GroupedExpenseIconProps = {
  size?: number;
  grouping: ExpenseGroupingRef;
  onClick?: () => void;
  className?: string;
};

export const GroupedExpenseIcon: React.FC<GroupedExpenseIconProps> = ({
  size,
  grouping,
  onClick,
  className,
}) => {
  const color = grouping.color ?? colors.blue[300];
  const luminance = getLuminance(color);

  return (
    <IconContainer title={grouping.title} onClick={onClick} className={className}>
      <Bookmark size={size || 24} title={grouping.title} color={color} />
      {grouping.title ? (
        <GroupedExpenseIconText color={luminance > 0.4 ? 'black' : 'white'}>
          {grouping.title[0]}
        </GroupedExpenseIconText>
      ) : null}
    </IconContainer>
  );
};

const IconContainer = styled('div')`
  cursor: pointer;
  position: relative;
  display: inline-block;
`;

const GroupedExpenseIconText = styled('div')`
  position: absolute;
  left: 0;
  right: 0;
  top: 3px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  ${({ color }: { color: string }) => `color: ${color};`}
  font-size: 10pt;
`;
