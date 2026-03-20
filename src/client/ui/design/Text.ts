import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { neutral } from '../Colors';

export const TitleCss = css`
  font-family: var(--mantine-font-family-headings);
  font-size: var(--mantine-h1-font-size);
  font-weight: var(--mantine-h1-font-weight);
  line-height: var(--mantine-h1-line-height);
`;

export const Title = styled.div`
  border-bottom: 1px solid ${neutral[3]};
  font-family: var(--mantine-font-family-headings);
  font-size: var(--mantine-h1-font-size);
  font-weight: var(--mantine-h1-font-weight);
  line-height: var(--mantine-h1-line-height);
  margin-bottom: 16px;
`;

export const Subtitle = styled.div`
  border-bottom: 1px solid ${neutral[1]};
  font-family: var(--mantine-font-family-headings);
  font-size: var(--mantine-h2-font-size);
  font-weight: var(--mantine-h2-font-weight);
  line-height: var(--mantine-h2-line-height);
  margin-bottom: 8px;

  &.small {
    font-size: var(--mantine-h3-font-size);
  }
`;

export const Text = styled.div``;
