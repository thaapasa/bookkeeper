import { Box, Button, Group, Modal, Select } from '@mantine/core';
import * as React from 'react';

import { Category } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { executeOperation } from 'client/util/ExecuteOperation';

import { TextEdit } from '../component/TextEdit';

const noParentOption: Category = {
  id: 0,
  name: '[Ei yläkategoriaa]',
  children: [],
  parentId: null,
  fullName: '[Ei yläkategoriaa]',
};

interface CategoryDialogProps {
  opened: boolean;
  onClose: () => void;
  onSaved: (id: number) => void;
  categories: Category[];
  editingCategory: Category | null;
  parentCategory: Category | null;
}

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  opened,
  onClose,
  onSaved,
  categories,
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

  const allCategories = React.useMemo(() => [noParentOption, ...categories], [categories]);

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
        <Select
          label="Yläkategoria"
          value={String(parentId)}
          onChange={val => setParentId(Number(val ?? 0))}
          data={allCategories.map(c => ({ value: String(c.id), label: c.name }))}
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
