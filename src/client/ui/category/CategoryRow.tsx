import * as React from 'react';
import * as colors from '../Colors';
import * as apiConnect from '../../data/ApiConnect';
import ExpenseRow from '../expense/ExpenseRow';
import { Map, noop } from '../../../shared/util/Util';
import { Category, CategoryAndTotals } from '../../../shared/types/Session';
import { AddCategoryButton, EditCategoryButton, ToggleButton } from './CategoryTools';
import { UserExpense } from '../../../shared/types/Expense';
import { DateRange } from '../../../shared/util/Time';

const styles: Map<React.CSSProperties> = {
  mainCategory: {
    background: colors.topItem,
    color: 'white',
    fontWeight: 'bold',
  },
  category: {
    background: colors.subItem,
  },
};

interface CategoryRowProps {
  category: Category;
  header: boolean;
  createCategory: (p: Category) => void;
  editCategory: (p: Category) => void;
  categoryTotals: Map<CategoryAndTotals>;
  range: DateRange;
}

interface CategoryRowState {
  open: boolean;
  isLoading: boolean;
  expenses: UserExpense[];
}

export default class CategoryRow extends React.Component<CategoryRowProps, CategoryRowState> {

  public state: CategoryRowState = {
    expenses: [],
    isLoading: false,
    open: false,
  };

  private reload = () => {
    if (this.state.open) {
      this.open();
    }
  }

  private renderCategoryExpenses = (expenses: UserExpense[]) => {
    if (this.state.isLoading) {
      return <div className="bk-table-row category-table-row"><div className="category-name">Ladataan...</div></div>;
    }
    return expenses && expenses.length > 0 ? expenses.map(expense => (
      <ExpenseRow
        expense={expense}
        key={'expense-row-' + expense.id}
        addFilter={noop}
        onUpdated={this.reload} />
    )) : (
      <div className="bk-table-row category-table-row">
        <div className="category-name">Ei kirjauksia</div>
      </div>
    );
  }

  private open = async () => {
    this.setState({ open: true, isLoading: true });
    const expenses = await apiConnect.searchExpenses(this.props.range.start, this.props.range.end, { categoryId: this.props.category.id });
    this.setState({ isLoading: false, expenses });
  }

  private close = () => {
    this.setState({ open: false, expenses: [] });
  }

  public render() {
    const category = this.props.category;
    const header = this.props.header;
    const totals = this.props.categoryTotals['' + category.id];
    return (
      <div className="category-container">
        <div className="bk-table-row category-table-row" style={header ? styles.mainCategory : styles.category}>
          <div className="category-name">{category.name}</div>
          <div className="category-sum">{header && totals ? totals.totalExpenses + ' / ' + totals.totalIncome : ''}</div>
          <div className="category-totals">{totals ? totals.expenses + ' / ' + totals.income : '0 / 0'}</div>
          <div className="category-tools">
            {header ?
              <AddCategoryButton parent={category} color={colors.white} onAdd={this.props.createCategory} /> : null}
            <EditCategoryButton category={category} color={header ? colors.white : null}
              onEdit={this.props.editCategory} />
            <ToggleButton category={category} color={header ? colors.white : null}
              onToggle={this.state.open ? this.close : this.open}
              state={this.state.open} />
          </div>
        </div>
        {this.state.open ? this.renderCategoryExpenses(this.state.expenses) : null}
      </div>
    );
  }
}
