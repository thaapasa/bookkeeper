import styled from '@emotion/styled';
import { Button } from '@mantine/core';
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
        <Description>{description}</Description>
        <CategorySelector addCategories={selectCat} />
      </div>
      <Actions>
        <Button variant="subtle" onKeyUp={handleKeyPress} onClick={() => onCancel()}>
          Peruuta
        </Button>
      </Actions>
    </>
  );
};

const Description = styled.div`
  margin-bottom: 8px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
`;
