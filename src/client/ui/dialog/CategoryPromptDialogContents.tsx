import { Button, DialogActions, DialogContent, styled } from '@mui/material';
import * as React from 'react';

import { CategorySelection, ObjectId } from 'shared/types';

import { CategorySelector } from '../component/CategorySelector';
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
      <DialogContent onKeyUp={handleKeyPress}>
        <Description>{description}</Description>
        <CategorySelector addCategories={selectCat} />
      </DialogContent>
      <DialogActions>
        <Button color="primary" variant="text" onKeyUp={handleKeyPress} onClick={() => onCancel()}>
          Peruuta
        </Button>
      </DialogActions>
    </>
  );
};

const Description = styled('div')`
  margin-bottom: 8px;
`;
