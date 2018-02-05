import * as React from 'react';
import * as Bacon from 'baconjs';
import CategoryDialog from './CategoryDialog';
import DatePicker from 'material-ui/DatePicker';
import * as state from '../../data/State';
import * as colors from '../Colors';
import * as apiConnect from '../../data/ApiConnect';
import ExpenseRow from '../expense/ExpenseRow';
import CategoryChart from './CategoryChart';
import { unsubscribeAll } from '../../util/ClientUtil';
import * as moment from 'moment';
import { Category } from '../../../shared/types/Session';
import { connect } from '../component/BaconConnect';
import { validSessionE } from '../../data/Login';
import { AddCategoryButton, EditCategoryButton, ToggleButton } from './CategoryTools';
import { reloadStream, CategoryRow } from './CategoryRow';
const debug = require('debug')('bookkeeper:category-view');

function MyDatePicker({ value, onChange, label }) {
  return (
    <DatePicker
      value={value}
      formatDate={d => moment(d).format("D.M.YYYY")}
      //display="inline"
      floatingLabelText={label}
      //floatingLabelFixed={true}
      fullWidth={true}
      autoOk={true}
      onChange={(event, date) => onChange(date)} />
  );
}

interface CategoryViewProps {
  categories: Category[];
}

interface CategoryViewState {
  categories: any[];
  startDate: Date;
  endDate: Date;
  categoryExpenses: any;
  categoryTotals: any;
  categoryChartData?: any;
}

class CategoryView extends React.Component<CategoryViewProps, CategoryViewState> {

  private startDateStr: Bacon.Bus<any, Date>;
  private endDateStr: Bacon.Bus<any, Date>;
  private datesStr: any;
  private categoryDialog: CategoryDialog | null = null;
  private unsub: any[];

  public state: CategoryViewState = {
    categories: [],
    startDate: new Date(),
    endDate: new Date(),
    categoryExpenses: {},
    categoryTotals: {},
  };

  private formCategoryChartData() {
    let chartData: any[] = [];
    this.state.categories && this.state.categories.forEach(c => {
      chartData.push({ categoryId: c.id, categoryName: c.name, categoryTotal: this.state.categoryTotals[c.id] ? this.state.categoryTotals[c.id].totalExpenses : 0 })
    })
    this.setState({ categoryChartData: chartData });
  }

  private getCategoryTotals(dates) {
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

  private reloadCategories = async (dates) => {
    const [totals, categories] = await Promise.all([
      this.getCategoryTotals(dates),
      apiConnect.getCategoryList()
    ]);
    this.setState({ categories });
    this.formCategoryChartData();
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

  public componentDidMount() {
    const end = moment().endOf('month');
    const endDate = end.toDate();
    const startDate = end.clone().startOf('year').toDate();

    this.setState({
      startDate,
      endDate,
      categories: state.get('categories'),
      categoryExpenses: {},
      categoryTotals: {},
    });
    this.startDateStr = new Bacon.Bus();
    this.endDateStr = new Bacon.Bus();
    this.datesStr = Bacon.combineTemplate({
      start: this.startDateStr.toProperty(startDate),
      end: this.endDateStr.toProperty(endDate),
      reload: reloadStream.toProperty(true)
    });

    this.unsub = [];
    this.startDateStr.onValue(startDate => this.setState({ startDate }));
    this.endDateStr.onValue(endDate => this.setState({ endDate }));
    this.unsub.push(this.startDateStr, this.endDateStr, this.datesStr);
    this.datesStr.onValue(this.reloadCategories);
    this.reloadCategories(this.datesStr);

    this.startDateStr.push(startDate);
    this.endDateStr.push(endDate);
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
    this.unsub = [];
  }

  private TimeSelector = () => {
    return (
      <div className="bk-table-row category-table-time-select no-border">
        <div className="bk-item-half horizontal-padding"><MyDatePicker
          key="start-date"
          value={this.state.startDate}
          label="Alku"
          onChange={d => this.startDateStr.push(d)} />
        </div>
        <div className="bk-item-half horizontal-padding"><MyDatePicker
          key="end-date"
          value={this.state.endDate}
          label="Loppu"
          onChange={d => this.endDateStr.push(d)} />
        </div>
      </div>
    );
  }

  private CategoryTable = ({ categories, categoryTotals, categoryExpenses, categoryChartData }) => {
    return (
      <div className="category-table">
        <this.TimeSelector />
        <CategoryChart
          chartData={categoryChartData} />
        <this.CategoryHeader />
        <div className="category-data-area">
          {categories.map(c => [<CategoryRow key={c.id} category={c} header={true} categoryExpenses={categoryExpenses} categoryTotals={categoryTotals}
            createCategory={this.createCategory} editCategory={this.editCategory} datesStr={this.datesStr} />]
            .concat(c.children.map(ch => <CategoryRow key={ch.id} header={false} category={ch} categoryExpenses={categoryExpenses} categoryTotals={categoryTotals}
              createCategory={this.createCategory} editCategory={this.editCategory} datesStr={this.datesStr} />)))}
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
          categories={this.state.categories}
          categoryTotals={this.state.categoryTotals}
          categoryExpenses={this.state.categoryExpenses}
          categoryChartData={this.state.categoryChartData} />
        <CategoryDialog ref={r => this.categoryDialog = r} categories={this.props.categories} />
      </div>
    );
  }

}

export default connect(validSessionE.map(s => ({ categories: s.categories })))(CategoryView);
