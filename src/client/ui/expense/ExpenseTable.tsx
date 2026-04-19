import { Box, Table } from '@mantine/core';
import * as React from 'react';

import { Expense, ExpenseStatus, UserExpense } from 'shared/expense';
import { Money, partition } from 'shared/util';
import { UserDataProps } from 'client/data/Categories';
import { useUserData } from 'client/data/SessionStore';

import { ListDecorator } from '../component/ListDecorator';
import { PageLayout } from '../layout/PageLayout';
import { ExpenseTotals } from './ExpenseHelper';
import { MonthlyStatus } from './MonthlyStatus';
import { computeDayParities, DayParityContext } from './row/DayParity';
import { ExpenseFilterRow } from './row/ExpenseFilterRow';
import { AddFilterFn, ExpenseFilter, ExpenseFilterFunction } from './row/ExpenseFilters';
import { CommonExpenseRowProps, ExpenseRow } from './row/ExpenseRow';
import { ExpenseRowSeparator } from './row/ExpenseRowSeparator';
import { ExpenseTableLayout } from './row/ExpenseTableLayout';
import { RecurringSummaryRow } from './row/RecurringSummaryRow';
import { RecurringExpenseSeparator } from './row/SpecialRows';

interface ExpenseTableProps {
  expenses: UserExpense[];
  startStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  monthStatus: ExpenseStatus;
  unconfirmedBefore: boolean;
  onUpdateExpense: (expenseId: number, expense: UserExpense) => void;
}

const ExpenseItem: React.FC<
  {
    item: UserExpense;
    userData: UserDataProps;
    prev: UserExpense | null;
  } & Omit<CommonExpenseRowProps, 'expense'>
> = ({ item, ...props }) => <ExpenseRow expense={item} {...props} />;

function expenseToKey(e: Expense) {
  return String(e.id);
}

function calculateTotals(expenses: Expense[]): ExpenseTotals | null {
  if (expenses.length < 1) {
    return null;
  }
  const income = expenses
    .filter(e => e.type === 'income')
    .reduce((s, c) => s.plus(c.sum), Money.zero);
  const expense = expenses
    .filter(e => e.type === 'expense')
    .reduce((s, c) => s.plus(c.sum), Money.zero);
  return { totalIncome: income, totalExpense: expense };
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onUpdateExpense,
  ...props
}) => {
  const userData = useUserData()!;

  const [filters, setFilters] = React.useState<ExpenseFilter[]>([]);
  const [recurringExpanded, setRecurringExpanded] = React.useState(false);

  const addFilter: AddFilterFn = (filter: ExpenseFilterFunction, name: string) => {
    setFilters(f => [...f, { filter, name }]);
  };

  const removeFilter = (index: number) => {
    setFilters(f => f.filter((_, i) => i !== index));
  };

  const onUpdated = (e: UserExpense) => {
    onUpdateExpense(e.id, e);
  };

  const filteredExpenses = React.useMemo(
    () => (expenses ? filters.reduce((a, b) => a.filter(b.filter), expenses) : []),
    [expenses, filters],
  );

  const totals = React.useMemo(() => calculateTotals(expenses), [expenses]);
  const filteredTotals = React.useMemo(() => calculateTotals(filteredExpenses), [filteredExpenses]);

  const renderRecurringExpenses = (recurring: UserExpense[]) => (
    <>
      <RecurringSummaryRow
        recurring={recurring}
        onToggle={() => setRecurringExpanded(v => !v)}
        isExpanded={recurringExpanded}
        addFilter={addFilter}
      />
      {recurringExpanded
        ? recurring.map(expense => (
            <ExpenseRow
              expense={expense}
              userData={userData}
              key={'expense-row-' + expense.id}
              addFilter={addFilter}
              onUpdated={onUpdated}
            />
          ))
        : null}
    </>
  );

  const renderExpenseRows = () => {
    const [recurring, normal] = partition(e => !!e.recurringExpenseId, filteredExpenses);
    if (recurring.length < 1) {
      const dayParities = computeDayParities(normal);
      return (
        <DayParityContext.Provider value={dayParities}>
          <ListDecorator
            items={normal}
            itemRenderer={ExpenseItem}
            userData={userData}
            addFilter={addFilter}
            onUpdated={onUpdated}
            separator={ExpenseRowSeparator}
            itemKey={expenseToKey}
          />
        </DayParityContext.Provider>
      );
    } else if (normal.length < 1) {
      return renderRecurringExpenses(recurring);
    }
    const dayParities = computeDayParities(normal);
    return (
      <>
        {renderRecurringExpenses(recurring)}
        <RecurringExpenseSeparator />
        <DayParityContext.Provider value={dayParities}>
          <ListDecorator
            items={normal}
            itemRenderer={ExpenseItem}
            userData={userData}
            addFilter={addFilter}
            onUpdated={onUpdated}
            separator={ExpenseRowSeparator}
            itemKey={expenseToKey}
          />
        </DayParityContext.Provider>
      </>
    );
  };

  return (
    <PageLayout
      footer={
        <MonthlyStatus
          {...props}
          unconfirmedDuring={expenses.some(e => !e.confirmed)}
          addFilter={addFilter}
          totals={totals}
          showFiltered={filters.length > 0}
          filteredTotals={filteredTotals}
        />
      }
    >
      <Box style={{ whiteSpace: 'nowrap' }}>
        <ExpenseTableLayout
          header={<ExpenseFilterRow filters={filters} onRemoveFilter={removeFilter} />}
        >
          <Table.Tbody>{renderExpenseRows()}</Table.Tbody>
        </ExpenseTableLayout>
      </Box>
    </PageLayout>
  );
};
