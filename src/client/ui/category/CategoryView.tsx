import * as React from 'react';
import * as apiConnect from '../../data/ApiConnect';
import { Category, CategoryAndTotals } from '../../../shared/types/Session';
import { connect } from '../component/BaconConnect';
import { validSessionE, updateSession } from '../../data/Login';
import { History } from 'history';
import { TypedDateRange, compareRanges } from '../../../shared/util/Time';
import { Map } from '../../../shared/util/Util';
import { CategoryChartData, CategoryTable } from './CategoryTable';
const debug = require('debug')('bookkeeper:category-view');

interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  history: History;
}

interface CategoryViewState {
  categoryTotals: Map<CategoryAndTotals>;
  categoryChartData?: CategoryChartData[];
  isLoading: boolean;
}


class CategoryView extends React.Component<CategoryViewProps, CategoryViewState> {

  public state: CategoryViewState = {
    categoryTotals: {},
    isLoading: true,
  };

  public componentDidMount() {
    this.loadCategories();
  }

  public componentDidUpdate(prevProps: CategoryViewProps) {
    if (compareRanges(this.props.range, prevProps.range) !== 0) {
      this.loadCategories();
    }
  }

  private formCategoryChartData(categoryTotals: Map<CategoryAndTotals>): CategoryChartData[] {
    return this.props.categories.map(c => ({
      categoryId: c.id,
      categoryName: c.name,
      categoryTotal: categoryTotals[c.id] && categoryTotals[c.id].totalExpenses || 0,
    }));
  }

  private async getCategoryTotals(): Promise<Map<CategoryAndTotals>> {
    const totals = await apiConnect.getCategoryTotals(this.props.range.start, this.props.range.end);
    const totalsMap: Map<CategoryAndTotals> = {};
    totals.forEach(t => {
      totalsMap['' + t.id] = t;
      if (t.children && t.children.length > 0) {
        t.children.forEach(ch => totalsMap['' + ch.id] = ch);
      }
    });
    return totalsMap;
  }

  private loadCategories = async() => {
    this.setState({ isLoading: true });
    const categoryTotals = await this.getCategoryTotals();
    const categoryChartData = this.formCategoryChartData(categoryTotals);
    this.setState({ categoryTotals, categoryChartData, isLoading: false });
  }

  private refresh = async () => {
    await updateSession();
  }

  public render() {
    if (this.state.isLoading) { return null; }
    return (
      <div className="content">
        <CategoryTable
          {...this.props}
          onCategoriesChanged={this.refresh}
          categoryTotals={this.state.categoryTotals}
          categoryChartData={this.state.categoryChartData} />
      </div>
    );
  }

}

export default connect(validSessionE.map(s => ({ categories: s.categories })))(CategoryView);
