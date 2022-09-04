import * as React from 'react';

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
import { useToggle } from '../utils/Hooks';
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
  className?: string;
}

function formatMoney(m?: MoneyLike): string {
  return m ? Money.from(m).format() : '-';
}

export const CategoryRow: React.FC<CategoryRowProps> = props => {
  const {
    category,
    header,
    categoryTotals,
    className,
    title,
    createCategory,
    editCategory,
  } = props;
  const [open, toggleOpen] = useToggle();

  const totals = categoryTotals['' + category.id];
  const clsName = `${className ?? ''} ${
    header ? 'main-category' : 'sub-category'
  }`;
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
  const toolColor = header
    ? colors.colorScheme.gray.veryDark
    : colors.colorScheme.secondary.standard;

  return (
    <>
      <Row className={clsName}>
        <NameColumn>{title || category.name}</NameColumn>
        <SumColumn className={colors.classNameForMoney(income)}>
          {formatMoney(income)}
        </SumColumn>
        <SumColumn className={colors.classNameForMoney(expense)}>
          {formatMoney(expense)}
        </SumColumn>
        {header ? (
          <ToolColumn>
            <AddCategoryButton
              parent={category}
              color={toolColor}
              onAdd={createCategory}
            />
          </ToolColumn>
        ) : (
          <ToolColumn>
            <EditCategoryButton
              category={category}
              color={toolColor}
              onEdit={editCategory}
            />
            <ToggleButton
              category={category}
              color={toolColor}
              onToggle={toggleOpen}
              state={open}
            />
          </ToolColumn>
        )}
      </Row>
      {open ? (
        <Row>
          <CategoryRowExpenses {...props} />
        </Row>
      ) : null}
    </>
  );
};

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
