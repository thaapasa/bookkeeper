import { Box, Button, Group } from '@mantine/core';
import * as React from 'react';

import { CategorySelection, ObjectId } from 'shared/types';

import { CategorySelector } from '../category/CategorySelector';
import { CategoryPromptDialogData, DialogContentRendererProps } from './Dialog';

type CategoryPromptDialogProps = DialogContentRendererProps<ObjectId> & CategoryPromptDialogData;

export const CategoryPromptDialogContents: React.FC<CategoryPromptDialogProps> = ({
  handleKeyPress,
  onSelect,
  onCancel,
  description,
}) => {
  const selectCat = (cat: CategorySelection | CategorySelection[]) => {
    const result = Array.isArray(cat) ? cat[0] : cat;
    if (!result) return;
    onSelect(result.id);
  };
  return (
    <>
      <div onKeyUp={handleKeyPress}>
        <Box mb="xs">{description}</Box>
        <CategorySelector addCategories={selectCat} />
      </div>
      <Group justify="flex-end" pt="md">
        <Button variant="subtle" onKeyUp={handleKeyPress} onClick={() => onCancel()}>
          Peruuta
        </Button>
      </Group>
    </>
  );
};
