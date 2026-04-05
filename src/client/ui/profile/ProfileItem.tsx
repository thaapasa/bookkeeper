import { Group, Text } from '@mantine/core';
import React from 'react';

export const ProfileItem: React.FC<
  React.PropsWithChildren<{ title?: string; labelFor?: string }>
> = ({ title, children, labelFor }) => (
  <>
    <Group align="center">
      <Text component="label" htmlFor={labelFor}>
        {title}
      </Text>
    </Group>
    <Group align="center" gap="md">
      {children}
    </Group>
  </>
);
