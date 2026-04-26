import { Box, type BoxProps, Group, type GroupProps } from '@mantine/core';
import * as React from 'react';

export const SubscriptionRow: React.FC<React.PropsWithChildren<GroupProps>> = props => (
  <Group gap={4} px="md" wrap="nowrap" align="center" mih={40} w="100%" {...props} />
);

export const Kind: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box
    w={28}
    ta="center"
    c="neutral.6"
    style={{ display: 'flex', justifyContent: 'center' }}
    {...props}
  />
);

export const Title: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box flex="0 0 240px" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} {...props} />
);

export const Subtitle: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box
    flex={1}
    c="neutral.7"
    fz="sm"
    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    {...props}
  />
);

export const Sum: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box
    w={104}
    ta="right"
    style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
    {...props}
  />
);

export const NextDate: React.FC<React.PropsWithChildren<BoxProps>> = props => (
  <Box w={120} ta="right" fz="sm" c="neutral.7" {...props} />
);

interface ToolsProps extends BoxProps {
  large?: boolean;
}

export const Tools: React.FC<React.PropsWithChildren<ToolsProps>> = ({ large, ...props }) => (
  <Box w={large ? 96 : 72} ta="right" {...props} />
);
