import { Box, Title, TitleProps } from '@mantine/core';
import React, { ReactNode } from 'react';

export interface PageTitleProps extends TitleProps {
  tools?: ReactNode;
  /** Use this to add extra horizontal padding for mobile,
   * when used with a full-width page layout. */
  padded?: boolean;
}

export function PageTitle({ order = 1, tools, padded, ...props }: PageTitleProps) {
  const title = (
    <Title
      order={order}
      mb="xs"
      pb={4}
      pt="md"
      px={{ base: padded ? 'md' : 0, sm: 0 }}
      style={{
        borderBottom:
          '1px solid light-dark(var(--mantine-color-neutral-3), var(--mantine-color-neutral-7))',
      }}
      {...props}
    />
  );
  return tools ? (
    <Box pos="relative">
      {title}
      <Box pos="absolute" right={0} bottom="var(--mantine-spacing-md)">
        {tools}
      </Box>
    </Box>
  ) : (
    title
  );
}
