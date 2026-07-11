import * as React from 'react';

/**
 * Map of expense ID → true for expenses that share their split group with at
 * least one other expense on the same day (see computeSplitGroups in
 * shared/expense). Purely visual: rows flagged here show the split-link icon.
 */
export const SplitGroupContext = React.createContext<Record<number, boolean>>({});
