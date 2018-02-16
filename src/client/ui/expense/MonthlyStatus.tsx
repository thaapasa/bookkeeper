import * as React from 'react';
import Money, { MoneyLike } from '../../../shared/util/Money';
import * as colors from '../Colors';
import styled from 'styled-components';
import { ExpenseTotals, money } from './ExpenseHelper';
import { ExpenseStatus } from '../../../shared/types/Expense';
import { fixedHorizontal } from '../Styles';
const debug = require('debug')('bookkeeper:expense-table');

interface StatusProps {
  unconfirmedBefore: boolean;
  startStatus: ExpenseStatus;
  monthStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  totals: ExpenseTotals | null;
  showFiltered: boolean;
  filteredTotals: ExpenseTotals | null;
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

const StatusContainer = fixedHorizontal.extend`
  height: 130px;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  font-size: 14px;
  border-top: 1px solid rgb(224, 224, 224);
`;

const MonthlyCalculation = styled.div`
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

export class MonthlyStatus extends React.Component<StatusProps, {}> {

  public componentDidMount() {
    debug(this.props);
    debug(this.props.startStatus, this.props.monthStatus, this.props.endStatus);
  }

  public componentDidUpdate() {
    debug(this.props.startStatus, this.props.monthStatus, this.props.endStatus);
  }

  public render() {
    const income = this.props.totals ? this.props.totals.totalIncome : 0;
    const expense = this.props.totals ? this.props.totals.totalExpense : 0;
    const filteredIncome = this.props.filteredTotals ? this.props.filteredTotals.totalIncome : 0;
    const filteredExpense = this.props.filteredTotals ? this.props.filteredTotals.totalExpense : 0;
    const filteredStyle = { display: (!this.props.showFiltered ? 'none' : ''), backgroundColor: 'rgb(224, 224, 224)' };
    const uncofirmedStyle = { background: this.props.unconfirmedBefore ? colors.unconfirmedStripes : undefined };
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
        <MonthlyCalculation style={uncofirmedStyle}>
          <CalculationHeader>Saatavat/velat</CalculationHeader>
          <CalculationRow title="Ennen" sum={this.props.startStatus.balance} />
          <CalculationRow title="Muutos" sum={this.props.monthStatus.balance} />
          <CalculationRow title="" sum={this.props.endStatus.balance} drawTopBorder={true} />
        </MonthlyCalculation>
      </StatusContainer>
    );
  }
}
