import * as React from 'react';
import * as Bacon from 'baconjs';
import * as state from '../../data/State';
import * as colors from '../Colors';
import * as apiConnect from '../../data/ApiConnect';
import ExpenseRow from '../expense/ExpenseRow';
import { unsubscribeAll } from '../../util/ClientUtil';
import { CSSProperties } from 'react';
import { Map } from '../../../shared/util/Util';
import { Category } from '../../../shared/types/Session';
import { AddCategoryButton, EditCategoryButton, ToggleButton } from './CategoryTools';
import { UserExpense } from '../../../shared/types/Expense';
import { DateRange } from '../../../shared/util/Time';
const debug = require('debug')('bookkeeper:category-view');

const styles: Map<CSSProperties> = {
  mainCategory: {
    background: colors.topItem,
    color: 'white',
    fontWeight: 'bold',
  },
  category: {
    background: colors.subItem,
  }
};

export const reloadStream = new Bacon.Bus();

interface CategoryRowProps {
  category: Category;
  header: boolean;
  createCategory: (p: Category) => void;
  editCategory: (p: Category) => void;
  categoryTotals: any;
  categoryExpenses?: any[];
  range: DateRange;
}

interface CategoryRowState {
  expenses: any[];
  open: boolean;
}

export class CategoryRow extends React.Component<CategoryRowProps, CategoryRowState> {

  private openStr = new Bacon.Bus<any, boolean>();
  private unsub: any[];
  private expenseStream: any;

  public state: CategoryRowState = {
    expenses: [],
    open: false
  };

  constructor(props: CategoryRowProps) {
    super(props);
    this.openStr.push(false);
  }

  public componentDidMount() {
    this.expenseStream = Bacon.combineTemplate({ open: this.openStr });
    this.openStr.onValue(open => this.setState({ open }));
    this.unsub = [this.expenseStream, this.openStr];
    this.expenseStream
      .flatMap(d => d.open ? Bacon.fromPromise(apiConnect.searchExpenses(this.props.range.start, this.props.range.end, { categoryId: this.props.category.id })) : Bacon.constant([]))
      .flatMapLatest(f => f)
      .onValue(o => this.setState({ expenses: o }));
    this.unsub.push(state.get('expensesUpdatedStream').onValue(date => reloadStream.push(true)));
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  private renderCategoryExpenses = (expenses: UserExpense[]) => {
    return expenses && expenses.length > 0 ? expenses.map(expense => <ExpenseRow
      expense={expense}
      key={"expense-row-" + expense.id}
      addFilter={() => { }}
      onUpdated={e => reloadStream.push(true)} />) :
      <div className="bk-table-row category-table-row"><div className="category-name">Ei kirjauksia</div></div>;
  }
  /*{this.props.categoryTotals[category.id].expenses} / {this.props.categoryTotals[category.id].income}*/
  public render() {
    const category = this.props.category;
    const header = this.props.header;
    return (
      <div className="category-container">
        <div className="bk-table-row category-table-row" style={header ? styles.mainCategory : styles.category}>
          <div className="category-name">{category.name}</div>
          <div className="category-sum">{header && (this.props.categoryTotals['' + category.id]) ? this.props.categoryTotals['' + category.id].totalExpenses + " / " + this.props.categoryTotals['' + category.id].totalIncome : ""}</div>
          <div className="category-totals">{(this.props.categoryTotals['' + category.id]) ? this.props.categoryTotals['' + category.id].expenses + " / " + this.props.categoryTotals['' + category.id].income : "0 / 0"}</div>
          <div className="category-tools">
            {header ?
              <AddCategoryButton parent={category} color={colors.white} onAdd={this.props.createCategory} /> : null}
            <EditCategoryButton category={category} color={header ? colors.white : null}
              onEdit={this.props.editCategory} />
            <ToggleButton category={category} color={header ? colors.white : null}
              onToggle={() => this.openStr.push(!this.state.open)}
              state={this.state.open} />
          </div>
        </div>
        {this.state.open ? this.renderCategoryExpenses(this.state.expenses) : null}
      </div>
    );
  }
}
