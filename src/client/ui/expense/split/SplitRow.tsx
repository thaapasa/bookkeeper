import { ActionIcon, Box, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { isDefined } from 'shared/types';
import { Money } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import { CategorySelector } from 'client/ui/component/CategorySelector';
import { UserSelector } from 'client/ui/component/UserSelector';
import { Icons } from 'client/ui/icons/Icons';

import { SourceSelector, SumField } from '../dialog/ExpenseDialogComponents';
import { ExpenseDialogData } from '../dialog/ExpenseDialogSessionData';
import { TitleField } from '../dialog/TitleField';
import { SourceIcon } from '../row/ExpenseRowComponents';
import { ExpenseSplitInEditor, SplitTools } from './ExpenseSplit.hooks';
import styles from './SplitRow.module.css';

type SplitRowProps = {
  split: ExpenseSplitInEditor;
  editSum: boolean;
  splitIndex: number;
} & Pick<ExpenseDialogData, 'categoryMap' | 'sourceMap' | 'sources'> &
  Pick<SplitTools, 'saveSplit' | 'removeSplit'>;

export const SplitRow: React.FC<SplitRowProps> = props => {
  const { split, categoryMap, editSum, removeSplit, splitIndex, sourceMap } = props;
  const [edit, { toggle: toggleEdit }] = useDisclosure(!split.title);
  return edit ? (
    <SplitEditor {...props} close={toggleEdit} />
  ) : (
    <Group className={styles.splitRowGrid}>
      <Box>
        {split.title}
        <br />
        {split.categoryId
          ? getFullCategoryName(split.categoryId, categoryMap)
          : 'Valitse kategoria'}
      </Box>
      <Group pos="relative" align="center">
        {split.sourceId ? <SourceIcon source={sourceMap[split.sourceId]} pt={5} /> : null}
        <UserSelector size={24} selected={split.benefit} />
      </Group>
      <Group justify="flex-end">{Money.from(split.sum).format()}</Group>
      <Group justify="flex-end" gap="xs">
        <ActionIcon onClick={toggleEdit}>
          <Icons.Edit />
        </ActionIcon>
        {editSum ? (
          <ActionIcon onClick={() => removeSplit(splitIndex)}>
            <Icons.Delete />
          </ActionIcon>
        ) : null}
      </Group>
    </Group>
  );
};

const SplitEditor: React.FC<SplitRowProps & { close: () => void }> = ({
  split,
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
    <Box className={styles.splitEditorGrid}>
      <Box className="name">
        <TitleField id="split-title" value={title} onChange={setTitle} onSelect={setCatId} />
      </Box>
      <Box className="cat">
        <CategorySelector value={catId ?? 0} onChange={setCatId} label="Kategoria" />
      </Box>
      <Group className="source" wrap="nowrap" w="100%">
        <SourceSelector
          sources={sources}
          value={sourceId ?? 0}
          onChange={setSourceId}
          title="Lähde"
          flex={1}
        />
        <UserSelector size={30} selected={benefit} onChange={setBenefit} pt={20} />
      </Group>
      <Box className="sum">
        {editSum ? <SumField value={sum} onChange={setSum} /> : Money.from(sum).format()}
      </Box>
      <Group className="actions" pt={20} gap="xs">
        <ActionIcon onClick={save} disabled={!allValid}>
          <Icons.Save />
        </ActionIcon>
        {editSum ? (
          <ActionIcon onClick={() => removeSplit(splitIndex)}>
            <Icons.Delete />
          </ActionIcon>
        ) : null}
      </Group>
    </Box>
  );
};
