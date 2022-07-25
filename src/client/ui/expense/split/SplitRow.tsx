import { Save } from '@mui/icons-material';
import { Grid } from '@mui/material';
import * as React from 'react';

import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import Money from 'shared/util/Money';
import { getFullCategoryName } from 'client/data/Categories';
import { Delete } from 'client/ui/Icons';

import { ToolIconButton } from '../details/ExpenseInfoTools';
import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { SumField } from '../dialog/ExpenseDialogComponents';
import { TitleField } from '../dialog/TitleField';

interface SplitRowProps
  extends Pick<
    ExpenseDialogProps,
    'categoryMap' | 'categorySource' | 'categories'
  > {
  split: ExpenseSplit | null;
  editSum: boolean;
  splitIndex: number;
  saveSplit: (i: number, split: ExpenseSplit) => void;
}

export const SplitRow: React.FC<SplitRowProps> = props => {
  const { split, categoryMap } = props;
  const [edit] = React.useState(false);
  const showEditor = edit || !split;
  return showEditor ? (
    <SplitEditor {...props} />
  ) : (
    <>
      <Grid item xs={4}>
        {split.title}
      </Grid>{' '}
      <Grid item xs={4}>
        {getFullCategoryName(split.categoryId, categoryMap)}{' '}
      </Grid>
      <Grid item xs={2}>
        {Money.from(split.sum).format()}
      </Grid>
      <Grid item container xs={2} justifyContent="flex-end">
        <ToolIconButton>
          <Delete />
        </ToolIconButton>
      </Grid>
    </>
  );
};

const SplitEditor: React.FC<SplitRowProps> = ({
  split,
  categorySource,
  categoryMap,
  splitIndex,
  saveSplit,
}) => {
  const [title, setTitle] = React.useState(split?.title ?? '');
  const [sum, setSum] = React.useState(
    Money.from(split?.sum ?? '0').toString()
  );
  const [catId, setCatId] = React.useState<number | undefined>(
    split?.categoryId
  );
  const selectCategory = (catId: number) => {
    setTitle(categorySource.find(s => s.value === catId)?.text ?? '');
    setCatId(catId);
  };

  const save = () => {
    if (catId) {
      saveSplit(splitIndex, {
        title,
        sum: Money.from(sum),
        categoryId: catId,
        sourceId: 1,
      });
    }
  };

  return (
    <>
      <Grid item xs={4}>
        <TitleField
          id="split-title"
          value={title}
          onSelect={selectCategory}
          onChange={setTitle}
          dataSource={categorySource}
        />
      </Grid>
      <Grid item xs={4}>
        {catId ? getFullCategoryName(catId, categoryMap) : 'Valitse kategoria'}
      </Grid>
      <Grid item xs={2}>
        <SumField value={sum} onChange={setSum} />
      </Grid>
      <Grid item xs={2} container justifyContent="flex-end">
        <ToolIconButton onClick={save}>
          <Save />
        </ToolIconButton>
        <ToolIconButton>
          <Delete />
        </ToolIconButton>
      </Grid>
    </>
  );
};
