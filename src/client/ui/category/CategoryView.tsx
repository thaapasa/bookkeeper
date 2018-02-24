import * as React from 'react';
import * as B from 'baconjs';
import { History } from 'history';
import { Map } from '../../../shared/util/Objects';
import { Category, CategoryAndTotals } from '../../../shared/types/Session';
import { TypedDateRange, compareRanges } from '../../../shared/util/Time';
import { unsubscribeAll } from '../../util/ClientUtil';
import apiConnect from '../../data/ApiConnect';
import { validSessionE, updateSession } from '../../data/Login';
import { needUpdateE, navigationBus } from '../../data/State';
import { connect } from '../component/BaconConnect';
import { CategoryTable } from './CategoryTable';
import { CategoryChartData } from './CategoryChart';
import { UserDataProps, userDataE } from '../../data/Categories';
import { categoryPagePath } from '../../util/Links';

interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  history: History;
  userData: UserDataProps;
}

interface CategoryViewState {
  categoryTotals: Map<CategoryAndTotals>;
  categoryChartData?: CategoryChartData[];
  isLoading: boolean;
}

class CategoryView extends React.Component<CategoryViewProps, CategoryViewState> {

  private unsub: any[] = [];

  public state: CategoryViewState = {
    categoryTotals: {},
    isLoading: true,
  };

  public async componentDidMount() {
    this.unsub.push(needUpdateE.onValue(this.loadCategories));
    await this.loadCategories();
  }

  public componentDidUpdate(prevProps: CategoryViewProps) {
    if (compareRanges(this.props.range, prevProps.range) !== 0) {
      this.loadCategories();
    }
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  private formCategoryChartData(categoryTotals: Map<CategoryAndTotals>): CategoryChartData[] {
    return this.props.categories.map(c => ({
      categoryId: c.id,
      categoryName: c.name,
      categoryTotal: categoryTotals[c.id] && categoryTotals[c.id].totalExpenses || 0,
    }));
  }

  private getCategoryTotals = async (): Promise<Map<CategoryAndTotals>> => {
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

  private loadCategories = async () => {
    navigationBus.push({ pathPrefix: categoryPagePath, dateRange: this.props.range });
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
          userData={this.props.userData}
          onCategoriesChanged={this.refresh}
          categoryTotals={this.state.categoryTotals}
          categoryChartData={this.state.categoryChartData} />
      </div>
    );
  }

}

export default connect(B.combineTemplate<any, { categories: Category[], userData: UserDataProps }>({
  categories: validSessionE.map(s => s.categories),
  userData: userDataE,
}))(CategoryView);
