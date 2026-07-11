import { Box } from '@mantine/core';
import * as React from 'react';

import { CategorySelection, ObjectId } from 'shared/types';

import { CategorySelector } from '../category/CategorySelector';
import { CategoryPromptDialogData, DialogContentRendererProps } from './Dialog';
import { DialogFooter } from './DialogFooter';

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
      <Box onKeyUp={handleKeyPress}>
        <Box mb="xs">{description}</Box>
        <CategorySelector addCategories={selectCat} />
      </Box>
      <DialogFooter onCancel={onCancel} handleKeyPress={handleKeyPress} />
    </>
  );
};
