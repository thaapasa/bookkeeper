import styled from '@emotion/styled';
import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { ExpenseSplit } from 'shared/expense';
import { isDefined } from 'shared/types';
import { Money } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import UserSelector from 'client/ui/component/UserSelector';
import { Icons } from 'client/ui/icons/Icons';

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
  const [edit, { toggle: toggleEdit }] = useDisclosure(!split.title);
  return edit ? (
    <SplitEditor {...props} close={toggleEdit} />
  ) : (
    <SplitGrid>
      <div style={{ gridColumn: 'span 3' }}>{split.title}</div>
      <div style={{ gridColumn: 'span 4' }}>
        {split.categoryId
          ? getFullCategoryName(split.categoryId, categoryMap)
          : 'Valitse kategoria'}
      </div>
      <RelDiv style={{ gridColumn: 'span 2' }}>
        {split.sourceId ? <SourceIcon source={sourceMap[split.sourceId]} /> : null}
        <FootNote>
          <UserSelector selected={split.benefit} />
        </FootNote>
      </RelDiv>
      <div style={{ gridColumn: 'span 2' }}>{Money.from(split.sum).format()}</div>
      <div style={{ gridColumn: 'span 1', display: 'flex', justifyContent: 'flex-end' }}>
        <ActionIcon onClick={toggleEdit}>
          <Icons.Edit />
        </ActionIcon>
        {editSum ? (
          <ActionIcon onClick={() => removeSplit(splitIndex)}>
            <Icons.Delete />
          </ActionIcon>
        ) : null}
      </div>
    </SplitGrid>
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
    <SplitGrid>
      <div style={{ gridColumn: 'span 5' }}>
        <TitleField
          id="split-title"
          value={title}
          onSelect={selectCategory}
          onChange={setTitle}
          dataSource={categorySource}
        />
      </div>
      <div style={{ gridColumn: 'span 4' }}>
        {catId ? getFullCategoryName(catId, categoryMap) : 'Valitse kategoria'}
      </div>
      <div style={{ gridColumn: 'span 2' }}>
        {editSum ? <SumField value={sum} onChange={setSum} /> : Money.from(sum).format()}
      </div>
      <div style={{ gridColumn: 'span 1', display: 'flex', justifyContent: 'flex-end' }}>
        <ActionIcon onClick={save} disabled={!allValid}>
          <Icons.Save />
        </ActionIcon>
        {editSum ? (
          <ActionIcon onClick={() => removeSplit(splitIndex)}>
            <Icons.Delete />
          </ActionIcon>
        ) : null}
      </div>
      <div style={{ gridColumn: 'span 7' }}>
        <SourceSelector
          sources={sources}
          value={sourceId ?? 0}
          onChange={setSourceId}
          title="Lähde"
        />
      </div>
      <div style={{ gridColumn: 'span 5' }}>
        <UserSelector selected={benefit} onChange={setBenefit} />
      </div>
    </SplitGrid>
  );
};

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 8px;
  align-items: center;
  width: 100%;
`;

const RelDiv = styled.div`
  position: relative;
`;

const FootNote = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  transform: scale(60%);
  transform-origin: bottom right;
`;
