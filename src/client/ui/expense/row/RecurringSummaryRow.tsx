import styled from '@emotion/styled';
import { Box, Group, Text } from '@mantine/core';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Minus, Money, Plus } from 'shared/util';
import { useWindowSize } from 'client/ui/hooks/useWindowSize';
import { Icons } from 'client/ui/icons/Icons';
import { isMobileSize, media } from 'client/ui/Styles';

import { ExpenseFilterFunction, ExpenseFilters } from './ExpenseFilters';
import {
  AllColumns,
  IconToolArea,
  RecurringExpenseIcon,
  Row,
  rowHeight,
  UnconfirmedIcon,
} from './ExpenseTableLayout';

interface RecurringSummaryRowProps {
  recurring: UserExpense[];
  isExpanded: boolean;
  onToggle: () => void;
  addFilter: (filter: ExpenseFilterFunction, name: string, avater?: string) => void;
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
  const isMobile = isMobileSize(useWindowSize());
  return (
    <Row>
      <AllColumns>
        <Group h={rowHeight} w="100%" style={{ position: 'relative' }} wrap="nowrap">
          <RecurringExpenseIcon />
          <Group
            flex={1}
            pl={16}
            h="100%"
            style={{ position: 'relative', zIndex: 1 }}
            wrap="nowrap"
          >
            {hasUnconfirmed ? (
              <IconToolArea>
                <UnconfirmedIcon
                  title="Sisältää alustavia kirjauksia"
                  onClick={() => addFilter(ExpenseFilters.unconfirmed, 'Alustavat')}
                />
              </IconToolArea>
            ) : null}
            <Text component="span" c="primary.7" fw="bold" pr={4}>
              Toistuvat{' '}
            </Text>{' '}
            ({recurring.length} kpl)
          </Group>
          <Item>
            {isMobile ? null : 'Tulot: '}
            <Text component="span" ta="right" fw="bold" display="inline-block" w={73}>
              {isMobile ? `${Plus} ` : null}
              {income.format()}
            </Text>
          </Item>
          <Item>
            {isMobile ? null : 'Menot: '}
            <Text component="span" ta="right" fw="bold" display="inline-block" w={73}>
              {isMobile ? `${Minus} ` : null}
              {expense.format()}
            </Text>
          </Item>
          <Item className="optional">
            Balanssi:{' '}
            <Text component="span" ta="right" fw="bold" display="inline-block" w={73}>
              {balance.format()}
            </Text>
          </Item>
          <Box px={8}>
            {isExpanded ? (
              <Icons.ExpandLess onClick={onToggle} />
            ) : (
              <Icons.ExpandMore onClick={onToggle} />
            )}
          </Box>
        </Group>
      </AllColumns>
    </Row>
  );
};

const Item = styled.div`
  padding: 0 8px;
  ${media.mobile`
    &.optional {
      display: none;
    }
  `}
`;
