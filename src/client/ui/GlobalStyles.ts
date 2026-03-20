import styled from '@emotion/styled';
import { Group } from '@mantine/core';

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
