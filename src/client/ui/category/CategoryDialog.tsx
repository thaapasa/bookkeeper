import { Box, Button, Group, Modal } from '@mantine/core';
import * as React from 'react';

import { Category } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { CategorySelector } from '../component/CategorySelector';
import { TextEdit } from '../component/TextEdit';

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
}) => {
  const [name, setName] = React.useState('');
  const [parentId, setParentId] = React.useState(0);

  const isNew = !editingCategory;
  const valid = name.length > 0;

  React.useEffect(() => {
    if (opened) {
      if (editingCategory) {
        setName(editingCategory.name);
        setParentId(editingCategory.parentId ?? 0);
      } else {
        setName('');
        setParentId(parentCategory?.id ?? 0);
      }
    }
  }, [opened, editingCategory, parentCategory]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = { name, parentId, children: [] };
    logger.info({ data }, 'Save category data');
    await executeOperation(
      () =>
        isNew
          ? apiConnect.storeCategory(data).then(c => c.categoryId || 0)
          : apiConnect.updateCategory(editingCategory.id, data).then(c => c.id),
      {
        success: `${isNew ? 'Tallennettu' : 'Päivitetty'} ${name}`,
        postProcess: (id: number | null) => {
          onClose();
          if (id != null) {
            onSaved(id);
          }
        },
      },
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isNew ? 'Uusi kategoria' : 'Muokkaa kategoriaa'}
      size="lg"
    >
      <Box component="form" pos="relative" style={{ zIndex: 1 }} onSubmit={save}>
        <TextEdit label="Nimi" placeholder="Nimi" value={name} onChange={setName} />
        <CategorySelector
          value={parentId}
          onChange={setParentId}
          mainOnly
          label="Yläkategoria"
          clearable
          mt="xs"
        />
      </Box>
      <Group justify="flex-end" gap="xs" pt="md">
        <Button variant="subtle" onClick={onClose}>
          Peruuta
        </Button>
        <Button variant="filled" disabled={!valid} onClick={save}>
          Tallenna
        </Button>
      </Group>
    </Modal>
  );
};
