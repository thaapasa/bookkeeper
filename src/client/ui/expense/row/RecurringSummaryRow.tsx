import { ActionIcon, Group, GroupProps, Table, Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Minus, Money, Plus } from 'shared/util';
import { DataValue, SectionLabel } from 'client/ui/design/Text';
import { useIsMobile } from 'client/ui/hooks/useBreakpoints';
import { Icons } from 'client/ui/icons/Icons';

import { AddFilterFn, ExpenseFilters } from './ExpenseFilters';
import { AllColumns } from './ExpenseTableColumns';
import { RecurringExpenseIcon, UnconfirmedIcon } from './TableIcons';

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
        <Group w="100%" wrap="nowrap" gap="lg">
          <Group flex={1} h="100%" wrap="nowrap" gap="sm" px="sm">
            <RecurringExpenseIcon />
            <SectionLabel component="span">Toistuvat</SectionLabel>
            <Text size="sm">({recurring.length} kpl)</Text>
            {hasUnconfirmed ? (
              <UnconfirmedIcon
                title="Sisältää alustavia kirjauksia"
                onClick={() => addFilter(ExpenseFilters.unconfirmed, 'Alustavat')}
                ml="xl"
              />
            ) : null}
          </Group>
          {!isMobile ? (
            <Group>
              <TotalItem label="Tulot:" sign={Plus} sum={income} />
              <TotalItem label="Menot:" sign={Minus} sum={expense} />
              <TotalItem label="Balanssi:" sum={balance} />
            </Group>
          ) : null}
          <ActionIcon onClick={onToggle}>
            {isExpanded ? <Icons.ExpandLess /> : <Icons.ExpandMore />}
          </ActionIcon>
        </Group>
      </AllColumns>
    </Table.Tr>
  );
};

function TotalItem({
  label,
  sum,
  sign,
  ...props
}: { label: string; sum: Money; sign?: string } & GroupProps) {
  return (
    <Group {...props} justify="space-between">
      <Text size="sm">{label}</Text>
      <DataValue size="sm">{sum.format()}</DataValue>
    </Group>
  );
}
