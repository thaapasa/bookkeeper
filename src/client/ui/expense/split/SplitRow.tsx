import * as React from 'react';

import { ExpenseSplit } from 'shared/types/ExpenseSplit';

interface SplitRowProps {
  split?: ExpenseSplit;
  editSum: boolean;
}

export const SplitRow: React.FC<SplitRowProps> = ({ split }) => {
  return <>Kirjaus {split?.sum}</>;
};
