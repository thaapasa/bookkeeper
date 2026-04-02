import { Box, type BoxProps, Group, type GroupProps } from '@mantine/core';
import * as React from 'react';

export const SubscriptionRow: React.FC<React.PropsWithChildren<GroupProps>> = props => (
  <Group gap={4} px="md" wrap="nowrap" align="center" mih={40} w="100%" {...props} />
);

export const Label: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box flex={1} {...props} />
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
