import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Title as MantineTitle, TitleProps } from '@mantine/core';
import React from 'react';

import { neutral } from '../Colors';

export const TitleCss = css`
  font-family: var(--mantine-font-family-headings);
  font-size: var(--mantine-h1-font-size);
  font-weight: var(--mantine-h1-font-weight);
  line-height: var(--mantine-h1-line-height);
`;

const StyledTitle = styled(MantineTitle)`
  border-bottom: 1px solid ${neutral[3]};
  margin-bottom: 16px;
`;

export const Title: React.FC<Omit<TitleProps, 'order'> & { order?: TitleProps['order'] }> = ({
  order = 1,
  ...props
}) => <StyledTitle order={order} {...props} />;

const StyledSubtitle = styled(MantineTitle)`
  border-bottom: 1px solid ${neutral[1]};
  margin-bottom: 8px;
`;

export const Subtitle: React.FC<Omit<TitleProps, 'order'> & { order?: TitleProps['order'] }> = ({
  order = 2,
  ...props
}) => <StyledSubtitle order={order} {...props} />;

/** @deprecated Use Mantine's Text component directly */
export { Text } from '@mantine/core';
