import { MantineSize, Table, TableTdProps } from '@mantine/core';
import * as React from 'react';

import { useIsMobilePortrait, useIsTablet } from 'client/ui/hooks/useBreakpoints';

export const ReceiverVisibleFrom = 'xs' satisfies MantineSize;
export const CategoryVisibleFrom = 'md' satisfies MantineSize;
export const SourceVisibleFrom = 'md' satisfies MantineSize;
export const BalanceVisibleFrom = 'md' satisfies MantineSize;

function useColumnCount(): number {
  const isMobilePortrait = useIsMobilePortrait(); // xs
  const isTablet = useIsTablet(); // sm
  if (isMobilePortrait) return 5;
  if (isTablet) return 6;
  return 9;
}

export const AllColumns: React.FC<TableTdProps> = props => {
  const colSpan = useColumnCount();
  return <Table.Td colSpan={colSpan} {...props} />;
};
