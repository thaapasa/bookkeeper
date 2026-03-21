import styled from '@emotion/styled';
import * as React from 'react';

import { Source } from 'shared/types';

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

const SourceImage = styled.img`
  max-width: 40px;
  max-height: 28px;
`;

export const TextButton = styled.button`
  border: 0;
  outline: none;
  background: none;
  font-size: inherit;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
