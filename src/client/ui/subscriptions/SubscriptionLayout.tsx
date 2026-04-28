import {
  Box,
  type BoxProps,
  Flex,
  type FlexProps,
  Group,
  type GroupProps,
  Text,
  type TextProps,
} from '@mantine/core';
import * as React from 'react';

export const SubscriptionRow: React.FC<React.PropsWithChildren<GroupProps>> = props => (
  <Group gap={4} px="md" wrap="nowrap" align="center" mih={40} w="100%" {...props} />
);

export const Kind: React.FC<React.PropsWithChildren<FlexProps>> = props => (
  <Flex w={28} justify="center" align="center" c="neutral.6" {...props} />
);

export const Title: React.FC<React.PropsWithChildren<TextProps>> = props => (
  <Text component="span" flex="0 0 240px" truncate {...props} />
);

export const Subtitle: React.FC<React.PropsWithChildren<TextProps>> = props => (
  <Text component="span" flex={1} c="neutral.7" fz="sm" truncate {...props} />
);

export const Sum: React.FC<React.PropsWithChildren<TextProps>> = props => (
  <Text
    component="span"
    w={104}
    ta="right"
    style={{ fontVariantNumeric: 'tabular-nums' }}
    truncate
    {...props}
  />
);

export const NextDate: React.FC<React.PropsWithChildren<TextProps>> = props => (
  <Text component="span" w={120} ta="right" fz="sm" c="neutral.7" {...props} />
);

interface ToolsProps extends BoxProps {
  large?: boolean;
}

export const Tools: React.FC<React.PropsWithChildren<ToolsProps>> = ({ large, ...props }) => (
  <Box w={large ? 96 : 72} ta="right" {...props} />
);
