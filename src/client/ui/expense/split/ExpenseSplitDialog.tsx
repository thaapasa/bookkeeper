import { Divider, Modal, Stack } from '@mantine/core';
import * as React from 'react';

import { ExpenseSplit } from 'shared/expense';
import { useBaconProperty } from 'client/ui/hooks/useBaconState';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { ExpenseDialogContent } from '../dialog/ExpenseDialogComponents';
import { expenseDialogDataP } from '../dialog/ExpenseDialogSessionData';
import { useExpenseSplit } from './ExpenseSplit.hooks';
import { SplitButtons } from './SplitButtons';
import { SplitHeader } from './SplitHeader';
import { SplitRow } from './SplitRow';

export const ExpenseSplitDialog: React.FC<ExpenseDialogProps<ExpenseSplit[]>> = ({
  original,
  onClose,
  onExpensesUpdated,
  isMobile,
}) => {
  const data = useBaconProperty(expenseDialogDataP);

  const { addRow, splits, validSplits, splitExpense, ...tools } = useExpenseSplit(
    original,
    data.sourceMap,
    onClose,
    onExpensesUpdated,
  );

  if (!original) {
    return null;
  }

  const dismiss = () => onClose(null);

  return (
    <Modal
      opened={true}
      onClose={dismiss}
      closeOnEscape={false}
      fullScreen={isMobile}
      size="lg"
      title=""
    >
      <SplitHeader expense={original} />
      <ExpenseDialogContent dividers={true} pb="md" pt="sm">
        <Stack gap="md">
          {splits.map((s, i) => (
            <React.Fragment key={s.key}>
              {i !== 0 ? <Divider /> : null}
              <SplitRow
                categoryMap={data.categoryMap}
                categorySource={data.categorySource}
                sourceMap={data.sourceMap}
                sources={data.sources}
                {...tools}
                split={s}
                splitIndex={i}
                editSum={i !== 0}
              />
            </React.Fragment>
          ))}
          <SplitButtons
            addRow={addRow}
            onClose={() => onClose(null)}
            splitExpense={validSplits ? splitExpense : undefined}
          />
        </Stack>
      </ExpenseDialogContent>
    </Modal>
  );
};
