import * as React from 'react';
import CategoryDialog from './CategoryDialog';
import CategoryChart, { CategoryChartData } from './CategoryChart';
import { Category, CategoryAndTotals } from '../../../shared/types/Session';
import { AddCategoryButton } from './CategoryTools';
import CategoryRow from './CategoryRow';
import { History } from 'history';
import { TypedDateRange } from '../../../shared/util/Time';
import { RangeSelector } from './RangeSelector';
import { categoriesForYear, categoriesForMonth } from '../../util/Links';
import { Map } from '../../../shared/util/Objects';
import { Action } from '../../../shared/types/Common';
const debug = require('debug')('bookkeeper:category-view');

interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  history: History;
  categoryTotals: Map<CategoryAndTotals>;
  categoryChartData?: CategoryChartData[];
  onCategoriesChanged: Action;
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

  private navigate = (d: Date) => {
    const path = this.props.range.type === 'year' ? categoriesForYear(d) : categoriesForMonth(d);
    this.props.history.push(path);
  }

  public render() {
    return (
      <div className="category-table">
        <RangeSelector range={this.props.range} onNavigate={this.navigate} />
        <CategoryChart chartData={this.props.categoryChartData} />
        <CategoryHeader onAdd={this.createCategory} />
        <div className="category-data-area">
          {this.props.categories.map(this.renderSubCategory)}
        </div>
        <CategoryDialog ref={r => this.categoryDialog = r} categories={this.props.categories} />
      </div>
    );
  }

  private renderSubCategory = (c: Category) => {
    return (
      <React.Fragment key={'subcategory-' + c.id}>
        <CategoryRow category={c} header={true}
          categoryTotals={this.props.categoryTotals}
          createCategory={this.createCategory} editCategory={this.editCategory}
          range={this.props.range} />
        {c.children.map(ch => <CategoryRow key={ch.id}
          header={false} category={ch} categoryTotals={this.props.categoryTotals}
          createCategory={this.createCategory} editCategory={this.editCategory}
          range={this.props.range} />)}
      </React.Fragment>
    );
  }

}
