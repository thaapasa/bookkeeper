import * as React from 'react';

import { TypedDateRange } from 'shared/time';
import { Action, Category, CategoryAndTotals } from 'shared/types';
import { UserDataProps } from 'client/data/Categories';
import { logger } from 'client/Logger';

import CategoryDialog from './CategoryDialog';
import { CategoryRow } from './CategoryRow';
import { CategoryHeader } from './CategoryTableLayout';

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
  const categoryDialogRef = React.useRef<CategoryDialog>(null);

  const createCategory = async (parent?: Category) => {
    if (!categoryDialogRef.current) {
      return;
    }
    const c = await categoryDialogRef.current.createCategory(parent);
    logger.info(c, 'Created new category');
    onCategoriesChanged();
  };

  const editCategory = async (category: Category) => {
    if (!categoryDialogRef.current) {
      return;
    }
    const c = await categoryDialogRef.current.editCategory(category);
    logger.info(c, 'Modified category');
    onCategoriesChanged();
  };

  return (
    <>
      <CategoryHeader onAdd={createCategory} />
      {categories.map(c => (
        <CategoryView
          {...props}
          category={c}
          key={c.id}
          editCategory={editCategory}
          createCategory={createCategory}
        />
      ))}
      <CategoryDialog ref={categoryDialogRef} categories={categories} />
    </>
  );
};

type CategoryViewProps = {
  category: Category;
  createCategory: (p?: Category) => void;
  editCategory: (p: Category) => void;
} & Pick<CategoryTableProps, 'range' | 'categoryTotals' | 'userData'>;

const CategoryView: React.FC<CategoryViewProps> = ({
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
