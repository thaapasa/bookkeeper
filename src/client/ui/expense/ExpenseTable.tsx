import { Box, Table } from '@mantine/core';
import * as React from 'react';

import { Expense, ExpenseStatus, UserExpense } from 'shared/expense';
import { Money, partition } from 'shared/util';
import { userDataP, UserDataProps } from 'client/data/Categories';

import { ListDecorator } from '../component/ListDecorator';
import { useBaconState } from '../hooks/useBaconState';
import { ExpenseTotals } from './ExpenseHelper';
import styles from './ExpenseTable.module.css';
import { MonthlyStatus } from './MonthlyStatus';
import { computeDayParities, DayParityContext } from './row/DayParity';
import { ExpenseFilterRow } from './row/ExpenseFilterRow';
import { AddFilterFn, ExpenseFilter, ExpenseFilterFunction } from './row/ExpenseFilters';
import { ExpenseHeader } from './row/ExpenseHeader';
import { CommonExpenseRowProps, ExpenseRow } from './row/ExpenseRow';
import { ExpenseRowSeparator } from './row/ExpenseRowSeparator';
import { ExpenseTableLayout } from './row/ExpenseTableLayout';
import { RecurringSummaryRow } from './row/RecurringSummaryRow';
import { LoadingIndicator, RecurringExpenseSeparator } from './row/SpecialRows';

interface ExpenseTableProps {
  expenses: UserExpense[];
  loading: boolean;
  startStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  monthStatus: ExpenseStatus;
  unconfirmedBefore: boolean;
  onUpdateExpense: (expenseId: number, expense: UserExpense) => void;
}

interface ExpenseTableInternalProps extends ExpenseTableProps {
  userData: UserDataProps;
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

const ExpenseTableView: React.FC<ExpenseTableInternalProps> = props => {
  const { expenses, loading, userData, onUpdateExpense } = props;
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
    if (loading && expenses.length < 1) {
      return <LoadingIndicator />;
    }
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
    <Box className={styles.container}>
      <Box px={{ base: 0, sm: 'md' }} style={{ whiteSpace: 'nowrap' }}>
        <ExpenseTableLayout loading={loading}>
          <Table.Thead>
            <ExpenseHeader />
            <ExpenseFilterRow filters={filters} onRemoveFilter={removeFilter} />
          </Table.Thead>
          <Table.Tbody>{renderExpenseRows()}</Table.Tbody>
        </ExpenseTableLayout>
      </Box>
      <Box flex={1} mx={{ base: 0, sm: 'md' }} className={styles.spacer} />
      <MonthlyStatus
        {...props}
        unconfirmedDuring={expenses.some(e => !e.confirmed)}
        addFilter={addFilter}
        totals={totals}
        showFiltered={filters.length > 0}
        filteredTotals={filteredTotals}
      />
    </Box>
  );
};

export const ExpenseTable: React.FC<ExpenseTableProps> = props => {
  const userData = useBaconState(userDataP);
  if (!userData) return null;
  return <ExpenseTableView {...props} userData={userData} />;
};
