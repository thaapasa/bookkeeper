import { Box, Group, Table } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Minus, Money, Plus } from 'shared/util';
import { DataValue, SectionLabel } from 'client/ui/design/Text';
import { useIsMobile } from 'client/ui/hooks/useBreakpoints';
import { Icons } from 'client/ui/icons/Icons';

import { AllColumns } from './Breakpoints';
import { AddFilterFn, ExpenseFilters } from './ExpenseFilters';
import { IconToolArea, RecurringExpenseIcon, UnconfirmedIcon } from './TableIcons';

interface RecurringSummaryRowProps {
  recurring: UserExpense[];
  isExpanded: boolean;
  onToggle: () => void;
  addFilter: AddFilterFn;
}

export const RecurringSummaryRow: React.FC<RecurringSummaryRowProps> = ({
  recurring,
  isExpanded,
  onToggle,
  addFilter,
}) => {
  const expense = recurring
    .filter(s => s.type === 'expense')
    .map(s => Money.from(s.sum))
    .reduce(Money.plus, Money.zero);
  const income = recurring
    .filter(s => s.type === 'income')
    .map(s => Money.from(s.sum))
    .reduce(Money.plus, Money.zero);
  const balance = recurring.map(s => Money.from(s.userBalance)).reduce(Money.plus, Money.zero);
  const hasUnconfirmed = recurring.some(r => !r.confirmed);
  const isMobile = useIsMobile();
  return (
    <Table.Tr>
      <AllColumns>
        <Group w="100%" wrap="nowrap">
          <RecurringExpenseIcon />
          <Group flex={1} h="100%" wrap="nowrap">
            {hasUnconfirmed ? (
              <IconToolArea>
                <UnconfirmedIcon
                  title="Sisältää alustavia kirjauksia"
                  onClick={() => addFilter(ExpenseFilters.unconfirmed, 'Alustavat')}
                />
              </IconToolArea>
            ) : null}
            <SectionLabel component="span" pr={4}>
              Toistuvat{' '}
            </SectionLabel>{' '}
            ({recurring.length} kpl)
          </Group>
          <Box px={8}>
            {isMobile ? null : 'Tulot: '}
            <DataValue w={73}>
              {isMobile ? `${Plus} ` : null}
              {income.format()}
            </DataValue>
          </Box>
          <Box px={8}>
            {isMobile ? null : 'Menot: '}
            <DataValue w={73}>
              {isMobile ? `${Minus} ` : null}
              {expense.format()}
            </DataValue>
          </Box>
          <Box px={8} visibleFrom="sm">
            Balanssi: <DataValue w={73}>{balance.format()}</DataValue>
          </Box>
          <Box px={8}>
            {isExpanded ? (
              <Icons.ExpandLess onClick={onToggle} />
            ) : (
              <Icons.ExpandMore onClick={onToggle} />
            )}
          </Box>
        </Group>
      </AllColumns>
    </Table.Tr>
  );
};
