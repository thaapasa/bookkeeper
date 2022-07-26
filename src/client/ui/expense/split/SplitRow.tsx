import { Save } from '@mui/icons-material';
import { Grid } from '@mui/material';
import * as React from 'react';

import { isDefined } from 'shared/types/Common';
import Money from 'shared/util/Money';
import { getFullCategoryName } from 'client/data/Categories';
import { Delete, Edit } from 'client/ui/Icons';
import { useToggle } from 'client/ui/utils/Hooks';

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
  const [edit, toggleEdit] = useToggle(!split.title);
  return edit ? (
    <SplitEditor {...props} close={toggleEdit} />
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
        <ToolIconButton onClick={toggleEdit}>
          <Edit />
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

const SplitEditor: React.FC<SplitRowProps & { close: () => void }> = ({
  split,
  categorySource,
  categoryMap,
  splitIndex,
  saveSplit,
  editSum,
  removeSplit,
  close,
}) => {
  const [title, setTitle] = React.useState(split?.title ?? '');
  const [sum, setSum] = React.useState(
    Money.from(split?.sum ?? '0').toString()
  );
  const [catId, setCatId] = React.useState<number | undefined>(
    split.categoryId
  );
  const selectCategory = (catId: number) => {
    setTitle(categorySource.find(s => s.value === catId)?.text ?? '');
    setCatId(catId);
  };

  const allValid = title !== '' && isDefined(catId);
  const validSplit = allValid
    ? {
        title,
        sum: Money.from(sum),
        categoryId: catId,
        sourceId: split.sourceId ?? 0,
        key: split.key,
      }
    : undefined;

  const save = () => {
    if (validSplit) {
      saveSplit(splitIndex, validSplit);
      close();
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
        {editSum ? (
          <SumField value={sum} onChange={setSum} />
        ) : (
          Money.from(sum).format()
        )}
      </Grid>
      <Grid item xs={2} container justifyContent="flex-end">
        <ToolIconButton onClick={save} disabled={!allValid}>
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
