import * as React from 'react';
import styled from 'styled-components';
import Money, { MoneyLike } from '../../../shared/util/Money';
import * as colors from '../Colors';
import { UnconfirmedIcon } from './ExpenseTableLayout';
import { ExpenseTotals, money } from './ExpenseHelper';
import { ExpenseStatus } from '../../../shared/types/Expense';
import { media } from '../Styles';

interface StatusProps {
  unconfirmedBefore: boolean;
  startStatus: ExpenseStatus;
  monthStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  totals: ExpenseTotals | null;
  showFiltered: boolean;
  filteredTotals: ExpenseTotals | null;
}

export class MonthlyStatus extends React.Component<StatusProps, {}> {

  public render() {
    const income = this.props.totals ? this.props.totals.totalIncome : 0;
    const expense = this.props.totals ? this.props.totals.totalExpense : 0;
    const filteredIncome = this.props.filteredTotals ? this.props.filteredTotals.totalIncome : 0;
    const filteredExpense = this.props.filteredTotals ? this.props.filteredTotals.totalExpense : 0;
    const filteredStyle = { display: (!this.props.showFiltered ? 'none' : ''), backgroundColor: 'rgb(224, 224, 224)' };
    return (
      <StatusContainer>
        <MonthlyCalculation style={filteredStyle}>
          <CalculationHeader>Suodatetut tulot ja menot</CalculationHeader>
          <CalculationRow title="Tulot" sum={filteredIncome} />
          <CalculationRow title="Menot" sum={Money.from(filteredExpense).abs().negate()} />
          <CalculationRow title="" sum={Money.from(filteredIncome).minus(filteredExpense)} drawTopBorder={true} />
        </MonthlyCalculation>
        <MonthlyCalculation>
          <CalculationHeader>Tulot ja menot</CalculationHeader>
          <CalculationRow title="Tulot" sum={income} />
          <CalculationRow title="Menot" sum={Money.from(expense).abs().negate()} />
          <CalculationRow title="" sum={Money.from(income).minus(expense)} drawTopBorder={true} />
        </MonthlyCalculation>
        <MonthlyCalculation>
          {this.props.unconfirmedBefore ? <UnconfirmedIcon /> : null}
          <CalculationHeader>Saatavat/velat</CalculationHeader>
          <CalculationRow title="Ennen" sum={this.props.startStatus.balance} />
          <CalculationRow title="Muutos" sum={this.props.monthStatus.balance} />
          <CalculationRow title="" sum={this.props.endStatus.balance} drawTopBorder={true} />
        </MonthlyCalculation>
      </StatusContainer>
    );
  }
}

const CalculationRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 3px 0px;
`;

const CalculationTitle = styled.div`
  display: inline-block;
  width: 100px;
`;

const CalculationSum = styled.div`
  display: inline-block;
  flex-grow: 1;
  text-align: right;
`;

const StatusContainer = styled.div`
  height: 130px;
  display: flex;
  justify-content: flex-end;
  font-size: 14px;
  border-top: 1px solid ${colors.colorScheme.gray.standard};
  border-collapse: collapse;
  margin: 0 16px;
  ${media.small`
    margin: 0;
  `}
`;

const MonthlyCalculation = styled.div`
  position: relative;
  width: 200px;
  padding: 20px;
`;

const CalculationHeader = styled.div`
  color: rgb(117, 117, 117);
  font-weight: 600;
  margin-bottom: 5px;
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
