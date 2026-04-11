import { Box } from '@mantine/core';
import { useIsFetching } from '@tanstack/react-query';
import * as React from 'react';

import styles from './IsFetchingBar.module.css';

export const IsFetchingBar: React.FC = () => {
  const isFetching = useIsFetching();
  if (isFetching === 0) return null;
  return <Box className={styles.bar} />;
};
