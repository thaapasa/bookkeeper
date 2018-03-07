import * as React from 'react';
import styled from 'styled-components';
import Money, { MoneyLike } from '../../../shared/util/Money';
import * as colors from '../Colors';
import { UnconfirmedIcon } from './ExpenseTableLayout';
import { ExpenseTotals, money } from './ExpenseHelper';
import { ExpenseStatus } from '../../../shared/types/Expense';
import { media } from '../Styles';
import { ExpandLess, ExpandMore } from '../Icons';

interface StatusProps {
  unconfirmedBefore: boolean;
  unconfirmedDuring: boolean;
  startStatus: ExpenseStatus;
  monthStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  totals: ExpenseTotals | null;
  showFiltered: boolean;
  filteredTotals: ExpenseTotals | null;
}

interface MonthlyStatusState {
  expanded: boolean;
}

export class MonthlyStatus extends React.Component<StatusProps, MonthlyStatusState> {

  public state: MonthlyStatusState = {
    expanded: false,
  };

  private toggle = () => {
    this.setState(s => ({ expanded: !s.expanded }));
  }

  public render() {
    const hasUnconfirmed = this.props.unconfirmedBefore || this.props.unconfirmedDuring;
    const income = this.props.totals ? this.props.totals.totalIncome : 0;
    const expense = this.props.totals ? this.props.totals.totalExpense : 0;
    const filteredIncome = this.props.filteredTotals ? this.props.filteredTotals.totalIncome : 0;
    const filteredExpense = this.props.filteredTotals ? this.props.filteredTotals.totalExpense : 0;
    const filteredStyle = { display: (!this.props.showFiltered ? 'none' : ''), backgroundColor: colors.colorScheme.gray.light };
    const expanded = this.state.expanded;
    return (
      <StatusContainer className={expanded ? 'expanded' : ''}>
        <StatusBlock title="Suodatetut" style={filteredStyle} incomeTitle="Tulot" expenseTitle="Menot" income={filteredIncome} expense={filteredExpense} expanded={expanded} />
        <StatusBlock title="Tulot ja menot" incomeTitle="Tulot" expenseTitle="Menot" income={income} expense={expense} expanded={expanded} className={this.props.showFiltered ? 'optional' : undefined} />
        <StatusBlock title="Saatavat/velat" incomeTitle="Ennen" expenseTitle="Tämä kk" income={this.props.startStatus.balance}
          expense={this.props.monthStatus.balance} expanded={expanded}>
          {hasUnconfirmed ? <UnconfirmedIcon /> : null}
        </StatusBlock>
        <ToolArea>
          {this.state.expanded ? <ExpandMore onClick={this.toggle} /> : <ExpandLess onClick={this.toggle} />}
        </ToolArea>
      </StatusContainer>
    );
  }
}

function StatusBlock({ title, incomeTitle, expenseTitle, expanded, style, income, expense, className, children }:
  { title: string, incomeTitle: string, expenseTitle: string, expanded: boolean,
    style?: React.CSSProperties, income: MoneyLike, expense: MoneyLike, className?: string, children?: any }) {
  return (
    <MonthlyCalculation style={style} className={className}>
      {children}
      <CalculationHeader>{title}</CalculationHeader>
      {expanded && <CalculationRow title={incomeTitle} sum={income} />}
      {expanded && <CalculationRow title={expenseTitle} sum={Money.from(expense).abs().negate()} />}
      <CalculationRow title="" sum={Money.from(income).minus(expense)} drawTopBorder={true} />
    </MonthlyCalculation>
  );
}

const ToolArea = styled.div`
  padding: 4px;
`;

const CalculationRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
`;

const CalculationTitle = styled.div`
  display: inline-block;
  width: 75px;
`;

const CalculationSum = styled.div`
  display: inline-block;
  width: 80px;
  text-align: right;
`;

const StatusContainer = styled.div`
  height: 64px;
  display: flex;
  justify-content: flex-end;
  font-size: 14px;
  border-top: 1px solid ${colors.colorScheme.gray.standard};
  border-collapse: collapse;
  margin: 0 16px;
  &.expanded {
    height: 150px;
  }
  ${media.mobile`
    margin: 0;
  `}
`;

const MonthlyCalculation = styled.div`
  position: relative;
  padding: 0 16px;
  ${media.mobilePortrait`
    &.optional {
      display: none;
    }
  `}
`;

const CalculationHeader = styled.div`
  color: ${colors.colorScheme.secondary.dark};
  font-weight: 600;
  margin: 8px 0;
  font-size: 14px;
`;

function CalculationRow({ title, sum, drawTopBorder }: { title: string, sum: MoneyLike, drawTopBorder?: boolean }) {
  const rowStyle = { borderTop: (drawTopBorder ? '1px solid rgb(224, 224, 224)' : 'none') };
  return (
    <CalculationRowContainer style={rowStyle}>
      <CalculationTitle>{title}</CalculationTitle>
      <CalculationSum>{money(sum)}</CalculationSum>
    </CalculationRowContainer>
  );
}
