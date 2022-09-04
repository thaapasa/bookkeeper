import * as React from 'react';

import { UserExpense } from 'shared/types/Expense';
import { ObjectId } from 'shared/types/Id';
import { Category, CategoryAndTotals } from 'shared/types/Session';
import Money, { MoneyLike } from 'shared/util/Money';
import { toISODate } from 'shared/util/Time';
import { UIDateRange } from 'shared/util/TimeRange';
import { noop } from 'shared/util/Util';
import apiConnect from 'client/data/ApiConnect';
import { UserDataProps } from 'client/data/Categories';
import { needUpdateE } from 'client/data/State';

import * as colors from '../Colors';
import ExpenseRow from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { useDeferredData } from '../utils/useAsyncData';
import {
  AllColumns,
  NameColumn,
  Row,
  SumColumn,
  ToolColumn,
} from './CategoryTableLayout';
import {
  AddCategoryButton,
  EditCategoryButton,
  ToggleButton,
} from './CategoryTools';

interface CategoryRowProps {
  category: Category;
  header: boolean;
  title?: string;
  createCategory: (p?: Category) => void;
  editCategory: (p: Category) => void;
  categoryTotals: Record<string, CategoryAndTotals>;
  range: UIDateRange;
  userData: UserDataProps;
}

interface CategoryRowState {
  open: boolean;
  isLoading: boolean;
  expenses: UserExpense[];
}

function formatMoney(m?: MoneyLike): string {
  return m ? Money.from(m).format() : '-';
}

export default class CategoryRow extends React.Component<
  CategoryRowProps,
  CategoryRowState
> {
  public state: CategoryRowState = {
    expenses: [],
    isLoading: false,
    open: false,
  };

  private open = async () => {
    this.setState({ open: true });
  };

  private close = () => {
    this.setState({ open: false, expenses: [] });
  };

  public renderTools() {
    const toolColor = this.props.header
      ? colors.colorScheme.gray.veryDark
      : colors.colorScheme.secondary.standard;
    if (this.props.header) {
      return (
        <ToolColumn>
          <AddCategoryButton
            parent={this.props.category}
            color={toolColor}
            onAdd={this.props.createCategory}
          />
        </ToolColumn>
      );
    } else {
      return (
        <ToolColumn>
          <EditCategoryButton
            category={this.props.category}
            color={toolColor}
            onEdit={this.props.editCategory}
          />
          <ToggleButton
            category={this.props.category}
            color={toolColor}
            onToggle={this.state.open ? this.close : this.open}
            state={this.state.open}
          />
        </ToolColumn>
      );
    }
  }

  public render() {
    const category = this.props.category;
    const header = this.props.header;
    const totals = this.props.categoryTotals['' + category.id];
    const className = header ? 'main-category' : 'sub-category';
    const income = totals
      ? header
        ? totals.totalIncome
        : totals.income
      : Money.zero;
    const expense = totals
      ? header
        ? totals.totalExpenses
        : totals.expenses
      : Money.zero;
    return (
      <React.Fragment>
        <Row className={className}>
          <NameColumn>{this.props.title || category.name}</NameColumn>
          <SumColumn className={colors.classNameForMoney(income)}>
            {formatMoney(income)}
          </SumColumn>
          <SumColumn className={colors.classNameForMoney(expense)}>
            {formatMoney(expense)}
          </SumColumn>
          {this.renderTools()}
        </Row>
        {this.state.open ? (
          <Row>
            <CategoryRowExpenses
              range={this.props.range}
              category={this.props.category}
              userData={this.props.userData}
            />
          </Row>
        ) : null}
      </React.Fragment>
    );
  }
}

/**
 * Renders the category expense list when opening the category expander
 */
const CategoryRowExpenses: React.FC<{
  range: UIDateRange;
  category: Category;
  userData: UserDataProps;
}> = ({ range, category, userData }) => {
  const { data, loadData } = useDeferredData(
    searchExpenses,
    true,
    range,
    category.id
  );
  React.useEffect(loadData, [loadData]);
  React.useEffect(() => needUpdateE.onValue(loadData), [loadData]);

  if (data.type !== 'loaded') {
    return <AllColumns>Ladataan...</AllColumns>;
  }
  if (!data.value || data.value.length < 1) {
    return <AllColumns>Ei kirjauksia</AllColumns>;
  }
  return (
    <ExpenseTableLayout className="padding">
      <tbody>
        {data.value.map(expense => (
          <ExpenseRow
            expense={expense}
            userData={userData}
            key={'expense-row-' + expense.id}
            addFilter={noop}
            onUpdated={loadData}
          />
        ))}
      </tbody>
    </ExpenseTableLayout>
  );
};

function searchExpenses(range: UIDateRange, categoryId: ObjectId) {
  return apiConnect.searchExpenses({
    startDate: toISODate(range.start),
    endDate: toISODate(range.end),
    categoryId,
    includeSubCategories: false,
  });
}
