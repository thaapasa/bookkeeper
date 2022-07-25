import { Grid } from '@mui/material';
import * as React from 'react';

import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import Money from 'shared/util/Money';
import { getFullCategoryName } from 'client/data/Categories';
import { TextEdit } from 'client/ui/component/TextEdit';
import { Delete } from 'client/ui/Icons';

import { ToolIconButton } from '../details/ExpenseInfoTools';
import { ExpenseDialogProps } from '../dialog/ExpenseDialog';

interface SplitRowProps extends Pick<ExpenseDialogProps, 'categoryMap'> {
  split?: ExpenseSplit;
  editSum: boolean;
}

export const SplitRow: React.FC<SplitRowProps> = props => {
  const { split, categoryMap } = props;
  const [edit] = React.useState(false);
  const showEditor = edit || !split;
  return showEditor ? (
    <SplitEditor {...props} />
  ) : (
    <>
      <Grid xs={4}>{split.title}</Grid>{' '}
      <Grid xs={5}>{getFullCategoryName(split.categoryId, categoryMap)} </Grid>
      <Grid xs={2}>{Money.from(split.sum).format()}</Grid>
      <Grid xs={1}>
        <ToolIconButton>
          <Delete />
        </ToolIconButton>
      </Grid>
    </>
  );
};

const SplitEditor: React.FC<SplitRowProps> = ({ split }) => {
  const [title, setTitle] = React.useState(split?.title ?? '');
  return (
    <>
      <Grid xs={4}>
        <TextEdit label="Nimi" value={title} onChange={setTitle} />
      </Grid>
      <Grid xs={8}>Yeah</Grid>
    </>
  );
};
