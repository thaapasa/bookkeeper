import { Box } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useIsFetching } from '@tanstack/react-query';
import * as React from 'react';

import { classNames } from 'client/ui/utils/classNames';

import styles from './IsFetchingBar.module.css';

export const IsFetchingBar: React.FC = () => {
  const isFetching = useIsFetching();
  const [debouncedFetching] = useDebouncedValue(isFetching, 200);
  const showBar = isFetching > 0 && debouncedFetching > 0;
  if (!showBar) return null;
  return <Box className={classNames(styles.bar, 'is-fetching-bar')} />;
};
