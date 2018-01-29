import * as React from 'react';
import Money, { MoneyLike } from '../../../shared/util/money';
import * as colors from '../colors';
import styled from 'styled-components';
import { ExpenseTotals } from './expense-helper';
import { ExpenseStatus } from '../../../shared/types/expense';
const debug = require('debug')('bookkeeper:expense-table');

function money(v?: MoneyLike): string {
    return v ? Money.from(v).format() : '-';
}

interface StatusProps {
    unconfirmedBefore: boolean;
    startStatus: ExpenseStatus;
    monthStatus: ExpenseStatus;
    endStatus: ExpenseStatus;
    totals: ExpenseTotals | null;
    showFiltered: boolean;
    filteredTotals: ExpenseTotals | null;
}

const CalculationRow = styled.div`
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


export class MonthlyStatus extends React.Component<StatusProps, {}> {

    private getCalculationRow(title: string, sum: MoneyLike, drawTopBorder: boolean) {
        const rowStyle = { borderTop: (drawTopBorder ? '1px solid rgb(224, 224, 224)' : 'none') }
        return (
            <CalculationRow style={rowStyle}>
                <CalculationTitle>{title}</CalculationTitle>
                <CalculationSum>{money(sum)}</CalculationSum>
            </CalculationRow>
        );
    }

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
        const filteredStyle = { display: (!this.props.showFiltered ? 'none' : ''), backgroundColor: 'rgb(224, 224, 224)'}
        const uncofirmedStyle = { background: this.props.unconfirmedBefore ? colors.unconfirmedStripes : undefined, };
        return (
            <div className="expense-table-monthly-status fixed-horizontal">
                <div className="monthly-calculation filtered" style={filteredStyle}>
                    <div className="header">Suodatetut tulot ja menot</div>
                    {this.getCalculationRow('Tulot', filteredIncome, false)}
                    {this.getCalculationRow('Menot', Money.from(filteredExpense).abs().negate(), false)}
                    {this.getCalculationRow('', Money.from(filteredIncome).minus(filteredExpense), true)}
                </div>
                <div className="monthly-calculation">
                    <div className="header">Tulot ja menot</div>
                    {this.getCalculationRow('Tulot', income, false)}
                    {this.getCalculationRow('Menot', Money.from(expense).abs().negate(), false)}
                    {this.getCalculationRow('', Money.from(income).minus(expense), true)}
                </div>
                <div className="monthly-calculation" style={uncofirmedStyle}>
                    <div className="header">Saatavat/velat</div>
                    {this.getCalculationRow('Ennen', this.props.startStatus.balance, false)}
                    {this.getCalculationRow('Muutos', this.props.monthStatus.balance, false)}
                    {this.getCalculationRow('', this.props.endStatus.balance, true)}
                </div>
            </div>
        );
    }
}
