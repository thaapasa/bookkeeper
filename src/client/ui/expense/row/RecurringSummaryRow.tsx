import { styled } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Minus, Money, Plus } from 'shared/util';
import { colorScheme } from 'client/ui/Colors';
import { useWindowSize } from 'client/ui/hooks/useWindowSize';
import { Icons } from 'client/ui/icons/Icons';
import { isMobileSize, media } from 'client/ui/Styles';

import { ExpenseFilterFunction, ExpenseFilters } from './ExpenseFilters';
import { AllColumns, RecurringExpenseIcon, Row, rowHeight, UnconfirmedIcon } from './ExpenseTableLayout';

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
        <RowContainer>
          <RecurringExpenseIcon />
          <Name>
            {hasUnconfirmed ? (
              <UnconfirmedIcon
                title="Sisältää alustavia kirjauksia"
                onClick={() => addFilter(ExpenseFilters.unconfirmed, 'Alustavat')}
              />
            ) : null}
            <Emph>Toistuvat </Emph> ({recurring.length} kpl)
          </Name>
          <Item>
            {isMobile ? null : 'Tulot: '}
            <Sum>
              {isMobile ? `${Plus} ` : null}
              {income.format()}
            </Sum>
          </Item>
          <Item>
            {isMobile ? null : 'Menot: '}
            <Sum>
              {isMobile ? `${Minus} ` : null}
              {expense.format()}
            </Sum>
          </Item>
          <Item className="optional">
            Balanssi: <Sum>{balance.format()}</Sum>
          </Item>
          <Tools>
            {isExpanded ? <Icons.ExpandLess onClick={onToggle} /> : <Icons.ExpandMore onClick={onToggle} />}
          </Tools>
        </RowContainer>
      </AllColumns>
    </Row>
  );
};

const Emph = styled('span')`
  color: ${colorScheme.secondary.dark};
  font-weight: bold;
  padding-right: 4px;
`;

const Name = styled('div')`
  padding: 0 0 0 16px;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
  position: relative;
  z-index: 1;
`;

const Item = styled('div')`
  padding: 0 8px;
  ${media.mobile`
    &.optional {
      display: none;
    }
  `}
`;

const Sum = styled('span')`
  width: 73px;
  display: inline-block;
  text-align: right;
  font-weight: bold;
  vertical-align: bottom;
`;

const Tools = styled('div')`
  padding: 0 8px;
`;

const RowContainer = styled('div')`
  width: 100%;
  height: ${rowHeight}px;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
`;
