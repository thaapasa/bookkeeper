import styled from '@emotion/styled';
import { Group } from '@mantine/core';

import { neutral } from './Colors';

/** @deprecated Use Mantine Group directly */
export const VCenterRow = Group;

export const Flex = styled.div`
  flex: 1;
  ${({ minWidth }: { minWidth?: string }) => (minWidth ? `min-width: ${minWidth};` : '')}
`;

export const Pre = styled.div`
  font-family: monospace;
  white-space: pre;
`;

export const PageContentContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: ${neutral[1]};
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;

  &.padded {
    padding: 24px;
  }

  &.center {
    align-items: center;
  }
`;
