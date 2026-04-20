import { Box, BoxProps } from '@mantine/core';
import * as React from 'react';

import styles from './PageLayout.module.css';

interface PageLayoutProps extends BoxProps {
  /** Sticky bottom content. The wrapper provides the border, bg tint, and
   *  horizontal bleed gradients; pass only the inner layout. */
  footer?: React.ReactNode;
  /** Set to true if content area should stretch from edge to edge (on mobile). */
  fullWidth?: boolean;
}

/**
 * Shared shell for routed pages. Provides the flex-column container with
 * collapsing horizontal padding (0 on mobile, md on sm+) that aligns with the
 * app-shell card, enforces a viewport-tall min-height, and optionally renders
 * a sticky footer with bg bleed into the card margins.
 */
export const PageLayout: React.FC<React.PropsWithChildren<PageLayoutProps>> = ({
  children,
  footer,
  fullWidth = false,
  ...props
}) => (
  <Box className={styles.container}>
    <Box px={{ base: fullWidth ? 0 : 'md', sm: 'md' }} {...props}>
      {children}
    </Box>
    {footer ? (
      <>
        <Box flex={1} mx={{ base: 0, sm: 'md' }} className={styles.spacer} />
        <Box mx={{ base: 0, sm: 'md' }} className={styles.footer}>
          {footer}
        </Box>
      </>
    ) : null}
  </Box>
);
