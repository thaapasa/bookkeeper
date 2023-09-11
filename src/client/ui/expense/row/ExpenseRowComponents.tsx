import { styled } from '@mui/material';
import * as React from 'react';

import { Source } from 'shared/types';

import { sourceWidth } from './ExpenseTableLayout';
import { styled } from '@mui/material';

export const SourceIcon: React.FC<{
  source: Source;
  onClick?: () => void;
}> = ({ source, onClick }) => {
  const content = source.image ? (
    <SourceImage src={source.image} title={source.name} />
  ) : source.abbreviation ? (
    source.abbreviation
  ) : (
    source.name
  );
  return (
    <TextButton key={source.id} onClick={onClick}>
      {content}
    </TextButton>
  );
};

const SourceImage = styled('img')`
  max-width: ${sourceWidth}px;
  max-height: 34px;
`;

export const TextButton = styled('button')`
  border: 0;
  font-size: 13px;
  outline: none;
  background: none;
  &:hover {
    text-decoration: underline;
  }
`;
