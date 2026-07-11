import { Box, Checkbox, Modal } from '@mantine/core';
import * as React from 'react';

import { Category } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { queryClient } from 'client/data/query';
import { QueryKeys } from 'client/data/queryKeys';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { CategorySelector } from '../component/CategorySelector';
import { TextEdit } from '../component/TextEdit';
import { DialogFooter } from '../dialog/DialogFooter';

interface CategoryDialogProps {
  opened: boolean;
  onClose: () => void;
  onSaved: (id: number) => void;
  editingCategory: Category | null;
  parentCategory: Category | null;
}

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  opened,
  onClose,
  onSaved,
  editingCategory,
  parentCategory,
}) => (
  <Modal
    opened={opened}
    onClose={onClose}
    title={editingCategory ? 'Muokkaa kategoriaa' : 'Uusi kategoria'}
    size="lg"
  >
    {/* The form is remounted (and thus reset) whenever the edited category changes.
        Mantine unmounts modal contents while closed, so opening also starts fresh. */}
    <CategoryForm
      key={editingCategory ? `edit-${editingCategory.id}` : `new-${parentCategory?.id ?? 0}`}
      onClose={onClose}
      onSaved={onSaved}
      editingCategory={editingCategory}
      parentCategory={parentCategory}
    />
  </Modal>
);

const CategoryForm: React.FC<Omit<CategoryDialogProps, 'opened'>> = ({
  onClose,
  onSaved,
  editingCategory,
  parentCategory,
}) => {
  const [name, setName] = React.useState(editingCategory?.name ?? '');
  const [parentId, setParentId] = React.useState(
    editingCategory ? (editingCategory.parentId ?? 0) : (parentCategory?.id ?? 0),
  );
  const [excludeFromTotals, setExcludeFromTotals] = React.useState(
    editingCategory?.excludeFromTotals ?? false,
  );

  const isNew = !editingCategory;
  const valid = name.length > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = { name, parentId, excludeFromTotals };
    logger.info({ data }, 'Save category data');
    await executeOperation(
      () =>
        isNew
          ? apiConnect.storeCategory(data).then(c => c.categoryId || 0)
          : apiConnect.updateCategory(editingCategory.id, data).then(c => c.id),
      {
        success: `${isNew ? 'Tallennettu' : 'Päivitetty'} ${name}`,
        postProcess: (id: number | null) => {
          queryClient.invalidateQueries({ queryKey: QueryKeys.categories.all });
          onClose();
          if (id != null) {
            onSaved(id);
          }
        },
      },
    );
  };

  return (
    <>
      <Box
        component="form"
        id="category-dialog-form"
        pos="relative"
        style={{ zIndex: 1 }}
        onSubmit={save}
      >
        <TextEdit label="Nimi" placeholder="Nimi" value={name} onChange={setName} />
        <CategorySelector
          value={parentId}
          onChange={setParentId}
          mainOnly
          label="Yläkategoria"
          clearable
          mt="xs"
        />
        <Checkbox
          mt="md"
          label="Jätä pois vuosikatsauksesta"
          description="Yläkategorian valinta jättää pois myös kaikki sen alakategoriat"
          checked={excludeFromTotals}
          onChange={e => setExcludeFromTotals(e.currentTarget.checked)}
        />
      </Box>
      <DialogFooter
        onCancel={onClose}
        okSubmitForm="category-dialog-form"
        okLabel="Tallenna"
        okDisabled={!valid}
      />
    </>
  );
};
