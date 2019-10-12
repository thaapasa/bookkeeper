import * as React from 'react';
import styled from 'styled-components';
import {
  RecurringExpenseIcon,
  Row,
  AllColumns,
  rowHeight,
} from './ExpenseTableLayout';
import { ExpandLess, ExpandMore } from '../Icons';
import { UserExpense } from '../../../shared/types/Expense';
import Money from '../../../shared/util/Money';
import { colorScheme } from '../Colors';
import { media } from '../Styles';

interface RecurringSummaryRowProps {
  recurring: UserExpense[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function RecurringSummaryRow(props: RecurringSummaryRowProps) {
  const expense = props.recurring
    .filter(s => s.type === 'expense')
    .map(s => Money.from(s.sum))
    .reduce(Money.plus, Money.zero);
  const income = props.recurring
    .filter(s => s.type === 'income')
    .map(s => Money.from(s.sum))
    .reduce(Money.plus, Money.zero);
  const balance = props.recurring
    .map(s => Money.from(s.userBalance))
    .reduce(Money.plus, Money.zero);
  return (
    <Row>
      <AllColumns>
        <RowContainer>
          <RecurringExpenseIcon />
          <Name>
            <Emph>Toistuvat</Emph> ({props.recurring.length} kpl)
          </Name>
          <Item>
            Tulot: <Sum>{income.format()}</Sum>
          </Item>
          <Item>
            Menot: <Sum>{expense.format()}</Sum>
          </Item>
          <Item className="optional">
            Balanssi: <Sum>{balance.format()}</Sum>
          </Item>
          <Tools>
            {props.isExpanded ? (
              <ExpandLess onClick={props.onToggle} />
            ) : (
              <ExpandMore onClick={props.onToggle} />
            )}
          </Tools>
        </RowContainer>
      </AllColumns>
    </Row>
  );
}

const Emph = styled.span`
  color: ${colorScheme.secondary.dark};
  font-weight: bold;
`;

const Name = styled.div`
  padding: 0 0 0 16px;
  flex: 1;
  position: relative;
  z-index: 1;
`;

const Item = styled.div`
  padding: 0 8px;
  ${media.mobile`
    &.optional {
      display: none;
    }
  `}
`;

const Sum = styled.span`
  width: 73px;
  display: inline-block;
  text-align: right;
  font-weight: bold;
`;

const Tools = styled.div`
  padding: 0 8px;
`;

const RowContainer = styled.div`
  width: 100%;
  height: ${rowHeight}px;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
`;
