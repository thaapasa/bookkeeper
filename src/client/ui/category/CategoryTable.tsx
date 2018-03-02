import * as React from 'react';
import styled from 'styled-components';
import CategoryDialog from './CategoryDialog';
import CategoryChart, { CategoryChartData } from './CategoryChart';
import { Category, CategoryAndTotals } from '../../../shared/types/Session';
import { AddCategoryButton } from './CategoryTools';
import CategoryRow from './CategoryRow';
import { TypedDateRange } from '../../../shared/util/Time';
import { Map } from '../../../shared/util/Objects';
import { Action } from '../../../shared/types/Common';
import { UserDataProps } from '../../data/Categories';
const debug = require('debug')('bookkeeper:category-view');

interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  categoryTotals: Map<CategoryAndTotals>;
  categoryChartData?: CategoryChartData[];
  onCategoriesChanged: Action;
  userData: UserDataProps;
}

function CategoryHeader({ onAdd }: { onAdd: (p?: Category) => void }) {
  return (
    <div className="category-table-row category-table-header header no-border">
      <div className="category-name">Nimi</div>
      <div className="category-totals">Kulut / Tulot</div>
      <div className="category-tools">
        <AddCategoryButton onAdd={onAdd} />
      </div>
    </div>
  );
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
      <CategoryTableContainer>
        <CategoryChart chartData={this.props.categoryChartData} />
        <CategoryHeader onAdd={this.createCategory} />
        <div className="category-data-area">
          {this.props.categories.map(this.renderSubCategory)}
        </div>
        <CategoryDialog ref={r => this.categoryDialog = r} categories={this.props.categories} />
      </CategoryTableContainer>
    );
  }

  private renderSubCategory = (c: Category) => {
    return (
      <React.Fragment key={'subcategory-' + c.id}>
        <CategoryRow {...this.props} category={c} header={true}
          createCategory={this.createCategory} editCategory={this.editCategory} />
        {c.children.map(ch => <CategoryRow key={ch.id} {...this.props} header={false} category={ch}
          createCategory={this.createCategory} editCategory={this.editCategory} />)}
      </React.Fragment>
    );
  }

}

const CategoryTableContainer = styled.div`
  font-size: 13px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
`;
