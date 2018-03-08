import * as React from 'react';
import * as colors from '../Colors';
import apiConnect from '../../data/ApiConnect';
import ExpenseRow from '../expense/ExpenseRow';
import { noop } from '../../../shared/util/Util';
import { Category, CategoryAndTotals } from '../../../shared/types/Session';
import { AddCategoryButton, EditCategoryButton, ToggleButton } from './CategoryTools';
import { UserExpense } from '../../../shared/types/Expense';
import { DateRange } from '../../../shared/util/Time';
import { Map } from '../../../shared/util/Objects';
import { UserDataProps } from '../../data/Categories';
import { ExpenseTableLayout } from '../expense/ExpenseTableLayout';
import { Row, NameColumn, SumColumn, ToolColumn, AllColumns } from './CategoryTableLayout';
import Money, { MoneyLike } from '../../../shared/util/Money';

interface CategoryRowProps {
  category: Category;
  header: boolean;
  createCategory: (p?: Category) => void;
  editCategory: (p: Category) => void;
  categoryTotals: Map<CategoryAndTotals>;
  range: DateRange;
  userData: UserDataProps;
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
      return <AllColumns>Ladataan...</AllColumns>;
    }
    if (!expenses || expenses.length < 1) {
      return <AllColumns>Ei kirjauksia</AllColumns>;
    }
    return (
      <ExpenseTableLayout>
        <tbody>
          {expenses.map(expense => (
            <ExpenseRow
              expense={expense}
              userData={this.props.userData}
              key={'expense-row-' + expense.id}
              addFilter={noop}
              onUpdated={this.reload} />
          ))}
        </tbody>
      </ExpenseTableLayout>
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
    const className = this.props.category.parentId ? 'sub-category' : 'main-category';
    return (
      <React.Fragment>
        <Row className={className}>
          <NameColumn>{category.name}</NameColumn>
          <SumColumn>{header && totals ? formatMoney(totals.totalExpenses) + ' / ' + formatMoney(totals.totalIncome) : ''}</SumColumn>
          <SumColumn>{totals ? formatMoney(totals.expenses) + ' / ' + formatMoney(totals.income) : '0 / 0'}</SumColumn>
          <ToolColumn>
            {header ?
              <AddCategoryButton parent={category} color={colors.white} onAdd={this.props.createCategory} /> : null}
            <EditCategoryButton category={category} color={header ? colors.white : null}
              onEdit={this.props.editCategory} />
            <ToggleButton category={category} color={header ? colors.white : null}
              onToggle={this.state.open ? this.close : this.open}
              state={this.state.open} />
          </ToolColumn>
        </Row>
        {this.state.open ? <Row>{this.renderCategoryExpenses(this.state.expenses)}</Row> : null}
      </React.Fragment>
    );
  }
}

function formatMoney(m?: MoneyLike): string {
  return m ? Money.from(m).format(2, { style: 'decimal' }) : '-';
}
