import * as React from 'react';
import * as Bacon from 'baconjs';
import CategoryDialog from './CategoryDialog';
import DatePicker from 'material-ui/DatePicker';
import * as apiConnect from '../../data/ApiConnect';
import ExpenseRow from '../expense/ExpenseRow';
import CategoryChart from './CategoryChart';
import { unsubscribeAll } from '../../util/ClientUtil';
import * as moment from 'moment';
import { Category } from '../../../shared/types/Session';
import { connect } from '../component/BaconConnect';
import { validSessionE, updateSession } from '../../data/Login';
import { AddCategoryButton, CategoryDatePicker } from './CategoryTools';
import { reloadStream, CategoryRow } from './CategoryRow';
import { History } from 'history';
import { TypedDateRange, DateRange } from '../../../shared/util/Time';
import { RangeSelector } from './RangeSelector';
import { categoriesForYear, categoriesForMonth } from '../../util/Links';
const debug = require('debug')('bookkeeper:category-view');


interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  history: History;
}

interface CategoryViewState {
  categoryExpenses: any;
  categoryTotals: any;
  categoryChartData?: any;
}

class CategoryView extends React.Component<CategoryViewProps, CategoryViewState> {

  private categoryDialog: CategoryDialog | null = null;

  public state: CategoryViewState = {
    categoryExpenses: {},
    categoryTotals: {},
  };

  private formCategoryChartData() {
    let chartData: any[] = [];
    this.props.categories.forEach(c => {
      chartData.push({ categoryId: c.id, categoryName: c.name, categoryTotal: this.state.categoryTotals[c.id] ? this.state.categoryTotals[c.id].totalExpenses : 0 })
    })
    this.setState({ categoryChartData: chartData });
  }

  private getCategoryTotals(dates: DateRange | null) {
    if (!dates) { return; }
    return apiConnect.getCategoryTotals(dates.start, dates.end).then(t => {
      let totalsMap = {};
      t && t.forEach(t => {
        totalsMap['' + t.id] = t;
        if (t.children && t.children.length > 0) {
          t.children.forEach(ch => totalsMap['' + ch.id] = ch);
        }
      });
      this.setState({ categoryTotals: totalsMap });
    })
  }

  private reloadCategories = async (dates: DateRange | null) => {
    const [totals, categories] = await Promise.all([
      this.getCategoryTotals(dates),
      apiConnect.getCategoryList()
    ]);
    this.formCategoryChartData();
    updateSession();
  }

  private createCategory = (parent: Category) => {
    if (!this.categoryDialog) { return; }
    this.categoryDialog.createCategory(parent)
      .then(c => debug('Created new category', c))
      .then(c => this.reloadCategories(null));
  }

  private editCategory = (category: Category) => {
    if (!this.categoryDialog) { return; }
    this.categoryDialog.editCategory(category)
      .then(c => debug('Modified category', c))
      .then(c => this.reloadCategories(null));
  }

  private navigate = (d: Date) => {
    const path = this.props.range.type === 'year' ? categoriesForYear(d) : categoriesForMonth(d);
    this.props.history.push(path);
  }

  private CategoryTable = ({ categories, categoryTotals, categoryExpenses, categoryChartData }) => {
    return (
      <div className="category-table">
        <RangeSelector range={this.props.range} onNavigate={this.navigate}/>
        <CategoryChart
          chartData={categoryChartData} />
        <this.CategoryHeader />
        <div className="category-data-area">
          {categories.map(c => [<CategoryRow key={c.id} category={c} header={true} categoryExpenses={categoryExpenses} categoryTotals={categoryTotals}
            createCategory={this.createCategory} editCategory={this.editCategory} range={this.props.range} />]
            .concat(c.children.map(ch => <CategoryRow key={ch.id} header={false} category={ch} categoryExpenses={categoryExpenses} categoryTotals={categoryTotals}
              createCategory={this.createCategory} editCategory={this.editCategory} range={this.props.range} />)))}
        </div>
      </div>
    );
  }

  private CategoryHeader = () => {
    return (
      <div className="category-table-row category-table-header header no-border">
        <div className="category-name">Nimi</div>
        <div className="category-totals">Kulut / Tulot</div>
        <div className="category-tools">
          <AddCategoryButton onAdd={this.createCategory} />
        </div>
      </div>
    );
  }

  public render() {
    return (
      <div className="content">
        <this.CategoryTable
          categories={this.props.categories}
          categoryTotals={this.state.categoryTotals}
          categoryExpenses={this.state.categoryExpenses}
          categoryChartData={this.state.categoryChartData} />
        <CategoryDialog ref={r => this.categoryDialog = r} categories={this.props.categories} />
      </div>
    );
  }

}

export default connect(validSessionE.map(s => ({ categories: s.categories })))(CategoryView);
