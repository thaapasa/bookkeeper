import { Save } from '@mui/icons-material';
import { Grid } from '@mui/material';
import * as React from 'react';

import Money from 'shared/util/Money';
import { getFullCategoryName } from 'client/data/Categories';
import { Delete } from 'client/ui/Icons';

import { ToolIconButton } from '../details/ExpenseInfoTools';
import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { SumField } from '../dialog/ExpenseDialogComponents';
import { TitleField } from '../dialog/TitleField';
import { ExpenseSplitInEditor, SplitTools } from './ExpenseSplit.hooks';

type SplitRowProps = {
  split: ExpenseSplitInEditor;
  editSum: boolean;
  splitIndex: number;
} & Pick<ExpenseDialogProps, 'categoryMap' | 'categorySource' | 'categories'> &
  Pick<SplitTools, 'saveSplit' | 'removeSplit'>;

export const SplitRow: React.FC<SplitRowProps> = props => {
  const { split, categoryMap, editSum, removeSplit, splitIndex } = props;
  const [edit] = React.useState(false);
  const showEditor = edit || !split.title;
  return showEditor ? (
    <SplitEditor {...props} />
  ) : (
    <>
      <Grid item xs={4}>
        {split.title}
      </Grid>{' '}
      <Grid item xs={4}>
        {split.categoryId
          ? getFullCategoryName(split.categoryId, categoryMap)
          : 'Valitse kategoria'}{' '}
      </Grid>
      <Grid item xs={2}>
        {Money.from(split.sum).format()}
      </Grid>
      <Grid item container xs={2} justifyContent="flex-end">
        {editSum ? (
          <ToolIconButton onClick={() => removeSplit(splitIndex)}>
            <Delete />
          </ToolIconButton>
        ) : null}
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
  editSum,
  removeSplit,
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
        sourceId: split.sourceId ?? 0,
        key: split.key,
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
        {editSum ? (
          <ToolIconButton onClick={() => removeSplit(splitIndex)}>
            <Delete />
          </ToolIconButton>
        ) : null}
      </Grid>
    </>
  );
};
