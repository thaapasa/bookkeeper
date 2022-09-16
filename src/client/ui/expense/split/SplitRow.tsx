import { Save } from '@mui/icons-material';
import { Grid } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { ExpenseSplit } from 'shared/expense';
import { isDefined } from 'shared/types';
import { Money } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import UserSelector from 'client/ui/component/UserSelector';
import { useToggle } from 'client/ui/hooks/useToggle';
import { Delete, Edit } from 'client/ui/Icons';

import { ToolIconButton } from '../details/ExpenseInfoTools';
import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { SourceSelector, SumField } from '../dialog/ExpenseDialogComponents';
import { TitleField } from '../dialog/TitleField';
import { SourceIcon } from '../row/ExpenseRowComponents';
import { ExpenseSplitInEditor, SplitTools } from './ExpenseSplit.hooks';

type SplitRowProps = {
  split: ExpenseSplitInEditor;
  editSum: boolean;
  splitIndex: number;
} & Pick<
  ExpenseDialogProps<ExpenseSplit[]>,
  'categoryMap' | 'categorySource' | 'categories' | 'sourceMap' | 'sources'
> &
  Pick<SplitTools, 'saveSplit' | 'removeSplit'>;

export const SplitRow: React.FC<SplitRowProps> = props => {
  const { split, categoryMap, editSum, removeSplit, splitIndex, sourceMap } =
    props;
  const [edit, toggleEdit] = useToggle(!split.title);
  return edit ? (
    <SplitEditor {...props} close={toggleEdit} />
  ) : (
    <>
      <Grid item xs={3}>
        {split.title}
      </Grid>{' '}
      <Grid item xs={4}>
        {split.categoryId
          ? getFullCategoryName(split.categoryId, categoryMap)
          : 'Valitse kategoria'}{' '}
      </Grid>
      <RGrid item xs={2}>
        {split.sourceId ? (
          <SourceIcon source={sourceMap[split.sourceId]} />
        ) : null}
        <FootNote>
          <UserSelector selected={split.benefit} />
        </FootNote>
      </RGrid>
      <Grid item xs={2}>
        {Money.from(split.sum).format()}
      </Grid>
      <Grid item container xs={1} justifyContent="flex-end">
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
  sources,
}) => {
  const [title, setTitle] = React.useState(split.title ?? '');
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
  const [sourceId, setSourceId] = React.useState(
    split.sourceId ?? sources[0]?.id ?? 0
  );
  const [benefit, setBenefit] = React.useState<number[]>(split.benefit);

  const allValid =
    title !== '' &&
    (Money.parse(sum)?.gt(0) ?? false) &&
    isDefined(sourceId) &&
    isDefined(catId) &&
    benefit.length > 0;
  const validSplit: ExpenseSplitInEditor | undefined = allValid
    ? {
        title,
        sum: Money.from(sum),
        categoryId: catId,
        sourceId: sourceId,
        key: split.key,
        benefit,
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
      <Grid item xs={5}>
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
      <Grid item xs={1} container justifyContent="flex-end">
        <ToolIconButton onClick={save} disabled={!allValid}>
          <Save />
        </ToolIconButton>
        {editSum ? (
          <ToolIconButton onClick={() => removeSplit(splitIndex)}>
            <Delete />
          </ToolIconButton>
        ) : null}
      </Grid>
      <Grid item xs={7}>
        <SourceSelector
          sources={sources}
          value={sourceId ?? 0}
          onChange={setSourceId}
          title="Lähde"
        />
      </Grid>
      <Grid item xs={5}>
        <UserSelector selected={benefit} onChange={setBenefit} />
      </Grid>
    </>
  );
};

const RGrid = styled(Grid)`
  position: relative;
`;

const FootNote = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  transform: scale(60%);
  transform-origin: bottom right;
`;
