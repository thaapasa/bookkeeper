import debug from 'debug';
import * as React from 'react';

import { Action } from 'shared/types/Common';
import { Category, CategoryAndTotals } from 'shared/types/Session';
import { TypedDateRange } from 'shared/util/TimeRange';
import { UserDataProps } from 'client/data/Categories';

import CategoryDialog from './CategoryDialog';
import { CategoryRow } from './CategoryRow';
import { CategoryHeader } from './CategoryTableLayout';

const log = debug('bookkeeper:category-view');

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
    log('Created new category', c);
    onCategoriesChanged();
  };

  const editCategory = async (category: Category) => {
    if (!categoryDialogRef.current) {
      return;
    }
    const c = await categoryDialogRef.current.editCategory(category);
    log('Modified category', c);
    onCategoriesChanged();
  };

  return (
    <React.Fragment>
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
    </React.Fragment>
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
    {category.children.map(ch => (
      <CategoryRow
        key={ch.id}
        {...props}
        header={false}
        category={ch}
        createCategory={createCategory}
        editCategory={editCategory}
      />
    ))}
  </>
);
