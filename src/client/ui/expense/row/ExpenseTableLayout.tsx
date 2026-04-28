import { Table } from '@mantine/core';
import * as React from 'react';

import { breakpointPx } from '../../theme/mantineTheme';
import { ExpenseHeader } from './ExpenseHeader';
import tableClasses from './ExpenseRow.module.css';
import { ColumnCountContext } from './ExpenseTableColumns';

const cx = (...cs: (string | undefined | null | false)[]) => cs.filter(Boolean).join(' ');

/**
 * Mirror of the container-query thresholds in ExpenseRow.module.css.
 * Receiver appears at xs, Category/Source/Balance appear at md; the
 * always-visible columns are Pvm + avatar + Nimi + Summa + Tools (5).
 * `breakpointPx` resolves against the live root font-size so this
 * stays in lock-step with the @container thresholds even when
 * coding-conventions.md's mobile root-size bump moves the boundary.
 */
function visibleColumnCount(widthPx: number): number {
  if (widthPx >= breakpointPx('md')) return 9;
  if (widthPx >= breakpointPx('xs')) return 6;
  return 5;
}

export const ExpenseTableLayout: React.FC<
  React.PropsWithChildren<{
    padded?: boolean;
    className?: string;
    /** Show the column header row. Can include extra header content (e.g. filter rows). */
    header?: boolean | React.ReactNode;
  }>
> = ({ padded, className, header, children }) => {
  // The container-type lives on a wrapper div instead of the <table>
  // because size containment on table elements is unreliable across
  // browsers. The container-query rules in ExpenseRow.module.css then
  // hide narrow-screen columns based on this wrapper's width.
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [colCount, setColCount] = React.useState<number>(9);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const apply = (w: number) => setColCount(visibleColumnCount(w));
    apply(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) apply(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className={tableClasses.tableContainer}>
      <ColumnCountContext.Provider value={colCount}>
        <Table
          layout="fixed"
          withRowBorders={false}
          withTableBorder={false}
          verticalSpacing="sm"
          fz="sm"
          className={cx(tableClasses.expenseTable, className)}
          px={padded ? 'md' : undefined}
        >
          <Table.Thead className={header ? undefined : tableClasses.zeroHeader}>
            <ExpenseHeader />
            {typeof header !== 'boolean' && header}
          </Table.Thead>
          {children}
        </Table>
      </ColumnCountContext.Provider>
    </div>
  );
};
