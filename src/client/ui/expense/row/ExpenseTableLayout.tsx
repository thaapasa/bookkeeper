import { Table } from '@mantine/core';
import * as React from 'react';

import { useIsMobile } from 'client/ui/hooks/useBreakpoints';

import tableClasses from './ExpenseRow.module.css';

const cx = (...cs: (string | undefined | null | false)[]) => cs.filter(Boolean).join(' ');

export const ExpenseTableLayout: React.FC<
  React.PropsWithChildren<{ loading?: boolean; padded?: boolean; className?: string }>
> = ({ loading, padded, className, children }) => {
  const isMobile = useIsMobile();

  return (
    <Table
      layout="fixed"
      withRowBorders={false}
      withTableBorder={false}
      verticalSpacing={isMobile ? 'md' : 'sm'}
      fz="sm"
      className={cx(tableClasses.expenseTable, className)}
      opacity={loading ? 0.4 : undefined}
      px={padded ? 'md' : undefined}
    >
      {children}
    </Table>
  );
};
