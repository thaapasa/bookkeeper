import { ActionIcon, Box, Group, Stack, StackProps, Text } from '@mantine/core';
import * as React from 'react';

import { ExpenseStatus } from 'shared/expense';
import { Money, MoneyLike } from 'shared/util';

import { Icons } from '../icons/Icons';
import { ExpenseTotals, money } from './ExpenseHelper';
import styles from './MonthlyStatus.module.css';
import { ExpenseFilterFunction, ExpenseFilters } from './row/ExpenseFilters';
import { UnconfirmedIcon } from './row/ExpenseTableLayout';

interface StatusProps {
  unconfirmedBefore: boolean;
  unconfirmedDuring: boolean;
  startStatus: ExpenseStatus;
  monthStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  totals: ExpenseTotals | null;
  showFiltered: boolean;
  filteredTotals: ExpenseTotals | null;
  addFilter: (filter: ExpenseFilterFunction, name: string, avatar?: string) => void;
}

export const MonthlyStatus: React.FC<StatusProps> = props => {
  const [expanded, setExpanded] = React.useState(false);

  const hasUnconfirmed = props.unconfirmedBefore || props.unconfirmedDuring;
  const income = props.totals ? props.totals.totalIncome : 0;
  const expense = props.totals ? props.totals.totalExpense : 0;
  const filteredIncome = props.filteredTotals ? props.filteredTotals.totalIncome : 0;
  const filteredExpense = props.filteredTotals ? props.filteredTotals.totalExpense : 0;

  return (
    <Group
      justify="flex-end"
      align="flex-start"
      wrap="nowrap"
      fz="sm"
      px={{ base: 'xs', sm: 16 }}
      mx={{ base: 0, sm: 16 }}
      className={styles.footer}
    >
      <Group gap="xl">
        {props.showFiltered && (
          <StatusBlock
            title="Suodatetut"
            incomeTitle="Tulot"
            expenseTitle="Menot"
            income={filteredIncome}
            expense={filteredExpense}
            expanded={expanded}
          />
        )}
        <StatusBlock
          title="Tulot ja menot"
          incomeTitle="Tulot"
          expenseTitle="Menot"
          income={income}
          expense={expense}
          expanded={expanded}
          className={props.showFiltered ? 'hide-on-mobile-portrait' : undefined}
        />
        <StatusBlock
          title="Saatavat/velat"
          incomeTitle="Ennen"
          expenseTitle="Tämä kk"
          income={props.startStatus.balance}
          expense={Money.from(props.monthStatus.balance).negate()}
          expanded={expanded}
        >
          {hasUnconfirmed && (
            <UnconfirmedIcon
              title="Sisältää alustavia kirjauksia"
              className={styles.unconfirmedIcon}
              style={{}}
              onClick={() => props.addFilter(ExpenseFilters.unconfirmed, 'Alustavat')}
            />
          )}
        </StatusBlock>
      </Group>
      <ActionIcon variant="subtle" size="md" onClick={() => setExpanded(e => !e)} mt={2}>
        {expanded ? <Icons.ExpandMore /> : <Icons.ExpandLess />}
      </ActionIcon>
    </Group>
  );
};

function StatusBlock({
  title,
  incomeTitle,
  expenseTitle,
  expanded,
  income,
  expense,
  bg,
  children,
  style,
  ...props
}: React.PropsWithChildren<
  {
    title: string;
    incomeTitle: string;
    expenseTitle: string;
    expanded: boolean;
    income: MoneyLike;
    expense: MoneyLike;
    bg?: string;
  } & StackProps
>) {
  const inc = Money.from(income);
  const exp = Money.from(expense).negate();
  const sum = inc.plus(exp);
  return (
    <Stack gap={2} bg={bg} style={{ ...style, position: 'relative' }} {...props}>
      <Text fz="sm" fw={600} c="primary.7" pt={6} pb={2}>
        {title}
      </Text>
      {expanded && <CalculationRow title={incomeTitle} sum={inc} />}
      {expanded && <CalculationRow title={expenseTitle} sum={exp} />}
      <CalculationRow title="Yhteensä" sum={sum} drawTopBorder={expanded} />
      <Box pb={4} />
      {children}
    </Stack>
  );
}

function CalculationRow({
  title,
  sum,
  drawTopBorder,
}: {
  title: string;
  sum: Money;
  drawTopBorder?: boolean;
}) {
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      py={4}
      style={
        drawTopBorder ? { borderTop: '1px solid var(--mantine-color-default-border)' } : undefined
      }
    >
      <Text fz="sm" w={60}>
        {title}
      </Text>
      <Text fz="sm" ta="right" w={80}>
        {money(sum)}
      </Text>
    </Group>
  );
}
