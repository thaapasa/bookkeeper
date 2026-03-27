import styled from '@emotion/styled';
import { Box, type BoxProps } from '@mantine/core';
import * as React from 'react';

import { neutral, primary, text } from '../Colors';
import { Row } from '../component/Row';

export const RowElement = styled(Row)`
  column-gap: 4px;
  padding: 0 16px;
  &.root-category {
    background-color: ${neutral[4]};
    color: ${text};
    font-weight: bold;
  }
  &.child-category {
    background-color: ${neutral[2]};
    color: ${primary[7]};
  }

  &.inactive {
    background: ${neutral[1]};
    color: ${neutral[7]};
  }
`;

export const Label: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box style={{ flex: 1 }} {...props} />
);

export const Dates: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box w={144} ta="right" {...props} />
);

export const Period: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box w={32} style={{ whiteSpace: 'nowrap' }} {...props} />
);

export const Sum: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box
    w={104}
    ta="right"
    style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
    {...props}
  />
);

interface ToolsProps extends BoxProps {
  large?: boolean;
}

export const Tools: React.FC<React.PropsWithChildren<ToolsProps>> = ({ large, ...props }) => (
  <Box w={large ? 64 : 32} ta="right" {...props} />
);
