import * as React from 'react';
import CategoryDialog from './CategoryDialog';
import { Category, CategoryAndTotals } from '../../../shared/types/Session';
import CategoryRow from './CategoryRow';
import { CategoryHeader } from './CategoryTableLayout';
import { TypedDateRange } from '../../../shared/util/Time';
import { Map } from '../../../shared/util/Objects';
import { Action } from '../../../shared/types/Common';
import { UserDataProps } from '../../data/Categories';
const debug = require('debug')('bookkeeper:category-view');

interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  categoryTotals: Map<CategoryAndTotals>;
  onCategoriesChanged: Action;
  userData: UserDataProps;
}

export class CategoryTable extends React.Component<CategoryViewProps, {}> {

  private categoryDialog: CategoryDialog | null = null;

  private createCategory = async (parent?: Category) => {
    if (!this.categoryDialog) { return; }
    const c = await this.categoryDialog.createCategory(parent);
    debug('Created new category', c);
    this.props.onCategoriesChanged();
  }

  private editCategory = async (category: Category) => {
    if (!this.categoryDialog) { return; }
    const c = await this.categoryDialog.editCategory(category);
    debug('Modified category', c);
    this.props.onCategoriesChanged();
  }

  public render() {
    return (
      <React.Fragment>
        <CategoryHeader onAdd={this.createCategory} />
        {this.props.categories.map(this.renderCategory)}
        <CategoryDialog ref={r => this.categoryDialog = r} categories={this.props.categories} />
      </React.Fragment>
    );
  }

  private renderCategory = (c: Category) => {
    return (
      <React.Fragment key={'subcategory-' + c.id}>
        <CategoryRow {...this.props} category={c} header={true}
          createCategory={this.createCategory} editCategory={this.editCategory} />
        <CategoryRow {...this.props} category={{ ...c, name: 'Pääkategorian kirjaukset', parentId: c.id, children: [] }} header={false}
          createCategory={this.createCategory} editCategory={this.editCategory} />
        {c.children.map(ch => <CategoryRow key={ch.id} {...this.props} header={false} category={ch}
          createCategory={this.createCategory} editCategory={this.editCategory} />)}
      </React.Fragment>
    );
  }

}
