import { Table, TableTdProps } from '@mantine/core';
import * as React from 'react';

import styles from './ExpenseRow.module.css';

/**
 * Container-query class names mirroring the previous viewport-based
 * `visibleFrom={...}` props. The expense table sets
 * `container-type: inline-size`, so columns now hide based on the
 * table's own width — important for embedding the row in narrow
 * contexts like the subscription editor's preview tab.
 */
export const ReceiverVisibleFrom = styles.hideBelowXs;
export const CategoryVisibleFrom = styles.hideBelowMd;
export const SourceVisibleFrom = styles.hideBelowMd;
export const BalanceVisibleFrom = styles.hideBelowMd;
export const ActionsVisibleFrom = styles.hideBelowSm;

/**
 * Visible column count for the current table. ExpenseTableLayout
 * measures its wrapper and supplies this so `AllColumns` (used by row
 * expanders / filter bars / recurring summary) can colspan to the
 * correct width — the previous viewport-based heuristic was wrong as
 * soon as the table itself was narrower than the viewport.
 *
 * Defaults to 9 (the desktop count) so a row used outside an
 * ExpenseTableLayout still spans something sane.
 */
export const ColumnCountContext = React.createContext<number>(9);

export const AllColumns: React.FC<TableTdProps> = props => {
  const colSpan = React.useContext(ColumnCountContext);
  return <Table.Td colSpan={colSpan} {...props} />;
};
