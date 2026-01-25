import { Save } from '@mui/icons-material';
import { Grid, styled } from '@mui/material';
import * as React from 'react';

import { ExpenseSplit } from 'shared/expense';
import { isDefined } from 'shared/types';
import { Money } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import UserSelector from 'client/ui/component/UserSelector';
import { useToggle } from 'client/ui/hooks/useToggle';
import { Icons } from 'client/ui/icons/Icons';

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
  const { split, categoryMap, editSum, removeSplit, splitIndex, sourceMap } = props;
  const [edit, toggleEdit] = useToggle(!split.title);
  return edit ? (
    <SplitEditor {...props} close={toggleEdit} />
  ) : (
    <>
      <Grid size={3}>{split.title}</Grid>{' '}
      <Grid size={4}>
        {split.categoryId
          ? getFullCategoryName(split.categoryId, categoryMap)
          : 'Valitse kategoria'}{' '}
      </Grid>
      <RGrid size={2}>
        {split.sourceId ? <SourceIcon source={sourceMap[split.sourceId]} /> : null}
        <FootNote>
          <UserSelector selected={split.benefit} />
        </FootNote>
      </RGrid>
      <Grid size={2}>{Money.from(split.sum).format()}</Grid>
      <Grid container size={1} justifyContent="flex-end">
        <ToolIconButton onClick={toggleEdit}>
          <Icons.Edit />
        </ToolIconButton>
        {editSum ? (
          <ToolIconButton onClick={() => removeSplit(splitIndex)}>
            <Icons.Delete />
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
  const [sum, setSum] = React.useState(Money.from(split?.sum ?? '0').toString());
  const [catId, setCatId] = React.useState<number | undefined>(split.categoryId);
  const selectCategory = (catId: number) => {
    setTitle(categorySource.find(s => s.value === catId)?.text ?? '');
    setCatId(catId);
  };
  const [sourceId, setSourceId] = React.useState(split.sourceId ?? sources[0]?.id ?? 0);
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
      <Grid size={5}>
        <TitleField
          id="split-title"
          value={title}
          onSelect={selectCategory}
          onChange={setTitle}
          dataSource={categorySource}
        />
      </Grid>
      <Grid size={4}>{catId ? getFullCategoryName(catId, categoryMap) : 'Valitse kategoria'}</Grid>
      <Grid size={2}>
        {editSum ? <SumField value={sum} onChange={setSum} /> : Money.from(sum).format()}
      </Grid>
      <Grid size={1} container justifyContent="flex-end">
        <ToolIconButton onClick={save} disabled={!allValid}>
          <Save />
        </ToolIconButton>
        {editSum ? (
          <ToolIconButton onClick={() => removeSplit(splitIndex)}>
            <Icons.Delete />
          </ToolIconButton>
        ) : null}
      </Grid>
      <Grid size={7}>
        <SourceSelector
          sources={sources}
          value={sourceId ?? 0}
          onChange={setSourceId}
          title="Lähde"
        />
      </Grid>
      <Grid size={5}>
        <UserSelector selected={benefit} onChange={setBenefit} />
      </Grid>
    </>
  );
};

const RGrid = styled(Grid)`
  position: relative;
`;

const FootNote = styled('div')`
  position: absolute;
  right: 0;
  bottom: 0;
  transform: scale(60%);
  transform-origin: bottom right;
`;
