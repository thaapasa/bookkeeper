import * as React from 'react';
import * as B from 'baconjs';
import { History } from 'history';
import { Category, CategoryAndTotals } from 'shared/types/Session';
import { TypedDateRange, compareRanges } from 'shared/util/Time';
import { unsubscribeAll } from 'client/util/ClientUtil';
import apiConnect from 'client/data/ApiConnect';
import { validSessionE, updateSession } from 'client/data/Login';
import { needUpdateE, navigationBus } from 'client/data/State';
import { connect } from '../component/BaconConnect';
import { CategoryTable } from './CategoryTable';
import CategoryChart, { CategoryChartData } from './CategoryChart';
import { UserDataProps, userDataE } from 'client/data/Categories';
import { categoryPagePath } from 'client/util/Links';
import Money from 'shared/util/Money';
import { PageContentContainer } from '../Styles';

interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  history: History;
  userData: UserDataProps;
}

interface CategoryViewState {
  categoryTotals: Record<string, CategoryAndTotals>;
  categoryChartData?: CategoryChartData[];
  isLoading: boolean;
}

class CategoryView extends React.Component<
  CategoryViewProps,
  CategoryViewState
> {
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

  private formCategoryChartData(
    categoryTotals: Record<string, CategoryAndTotals>
  ): CategoryChartData[] {
    return this.props.categories.map(c => ({
      categoryId: c.id,
      categoryName: c.name,
      categoryTotal: Money.toValue(
        (categoryTotals[c.id] && categoryTotals[c.id].totalExpenses) || 0
      ),
    }));
  }

  private getCategoryTotals = async (): Promise<
    Record<string, CategoryAndTotals>
  > => {
    const totals = await apiConnect.getCategoryTotals(
      this.props.range.start,
      this.props.range.end
    );
    const totalsMap: Record<string, CategoryAndTotals> = {};
    totals.forEach(t => {
      totalsMap['' + t.id] = t;
      if (t.children && t.children.length > 0) {
        t.children.forEach(ch => (totalsMap['' + ch.id] = ch));
      }
    });
    return totalsMap;
  };

  private loadCategories = async () => {
    navigationBus.push({
      pathPrefix: categoryPagePath,
      dateRange: this.props.range,
    });
    this.setState({ isLoading: true });
    const categoryTotals = await this.getCategoryTotals();
    const categoryChartData = this.formCategoryChartData(categoryTotals);
    this.setState({ categoryTotals, categoryChartData, isLoading: false });
  };

  private refresh = async () => {
    await updateSession();
  };

  public render() {
    if (this.state.isLoading) {
      return null;
    }
    return (
      <PageContentContainer>
        <div>
          <CategoryChart chartData={this.state.categoryChartData} />
          <CategoryTable
            {...this.props}
            userData={this.props.userData}
            onCategoriesChanged={this.refresh}
            categoryTotals={this.state.categoryTotals}
          />
        </div>
      </PageContentContainer>
    );
  }
}

export default connect(
  B.combineTemplate({
    categories: validSessionE.map(s => s.categories),
    userData: userDataE,
  })
)(CategoryView);
