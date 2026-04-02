import { Badge, Box, BoxProps, Group, Stack, StackProps } from '@mantine/core';
import * as React from 'react';

import styles from './InfoLayoutElements.module.css';

export const InfoItem: React.FC<React.PropsWithChildren<BoxProps>> = ({ children, ...props }) => (
  <Box className={styles.infoItem} {...props}>
    {children}
  </Box>
);

export const Label: React.FC<React.PropsWithChildren<BoxProps>> = ({ children, ...props }) => (
  <Box w={150} my="xs" {...props}>
    {children}
  </Box>
);

export const Value: React.FC<React.PropsWithChildren<StackProps>> = ({ children, ...props }) => (
  <Stack gap={0} {...props}>
    {children}
  </Stack>
);

export const SubValue: React.FC<React.PropsWithChildren<StackProps>> = ({ children, ...props }) => (
  <Stack gap={0} ml="md" {...props}>
    {children}
  </Stack>
);

export const ItemWithId: React.FC<{ id: string | number; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <Group gap="xs" my={4}>
    <Badge variant="light" color="primary" radius="md" px="xs" py={4}>
      {id}
    </Badge>
    {children}
  </Group>
);
