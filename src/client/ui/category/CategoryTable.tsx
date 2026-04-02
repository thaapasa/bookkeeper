import { Table } from '@mantine/core';
import * as React from 'react';

import { TypedDateRange } from 'shared/time';
import { Action, Category, CategoryAndTotals } from 'shared/types';
import { UserDataProps } from 'client/data/Categories';
import { logger } from 'client/Logger';

import { CategoryDialog } from './CategoryDialog';
import { CategoryRow } from './CategoryRow';
import { CategoryHeader, CategoryTableLayout } from './CategoryTableLayout';

interface CategoryTableProps {
  categories: Category[];
  range: TypedDateRange;
  categoryTotals: Record<string, CategoryAndTotals>;
  onCategoriesChanged: Action;
  userData: UserDataProps;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  onCategoriesChanged,
  categories,
  ...props
}) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [parentCategory, setParentCategory] = React.useState<Category | null>(null);

  const createCategory = (parent?: Category) => {
    setEditingCategory(null);
    setParentCategory(parent ?? null);
    setDialogOpen(true);
  };

  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setParentCategory(null);
    setDialogOpen(true);
  };

  const onDialogSaved = (id: number) => {
    logger.info({ id }, editingCategory ? 'Modified category' : 'Created new category');
    onCategoriesChanged();
  };

  return (
    <>
      <CategoryTableLayout>
        <Table.Thead>
          <CategoryHeader onAdd={createCategory} />
        </Table.Thead>
        <Table.Tbody>
          {categories.map(c => (
            <CategoryGroup
              {...props}
              category={c}
              key={c.id}
              editCategory={editCategory}
              createCategory={createCategory}
            />
          ))}
        </Table.Tbody>
      </CategoryTableLayout>
      <CategoryDialog
        opened={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={onDialogSaved}
        categories={categories}
        editingCategory={editingCategory}
        parentCategory={parentCategory}
      />
    </>
  );
};

type CategoryGroupProps = {
  category: Category;
  createCategory: (p?: Category) => void;
  editCategory: (p: Category) => void;
} & Pick<CategoryTableProps, 'range' | 'categoryTotals' | 'userData'>;

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  createCategory,
  editCategory,
  ...props
}) => (
  <>
    <CategoryRow
      {...props}
      category={category}
      header={true}
      createCategory={createCategory}
      editCategory={editCategory}
    />
    <CategoryRow
      {...props}
      title="Pääkategorian kirjaukset"
      category={{
        ...category,
        children: [],
      }}
      header={false}
      createCategory={createCategory}
      editCategory={editCategory}
    />
    {category.children?.map(ch => (
      <CategoryRow
        key={ch.id}
        {...props}
        header={false}
        category={ch}
        createCategory={createCategory}
        editCategory={editCategory}
      />
    )) ?? null}
  </>
);
