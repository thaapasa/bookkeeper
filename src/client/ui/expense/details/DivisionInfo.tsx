import * as React from 'react';
import styled from 'styled-components';
import * as colors from '../../Colors';
import UserAvatar from '../../component/UserAvatar';
import Money, { MoneyLike } from '../../../../shared/util/Money';
import { ExpenseDivisionItem, UserExpense } from '../../../../shared/types/Expense';
import { Map } from '../../../../shared/util/Objects';
import { media } from '../../Styles';

interface DivisionInfoProps {
  division: ExpenseDivisionItem[];
  expense: UserExpense;
}

const divisionTypes = ['cost', 'benefit', 'income', 'split'];

export default class ExpenseInfo extends React.Component<DivisionInfoProps, {}> {

  public render() {
    const division = this.props.division;
    const expense = this.props.expense;
    const isIncome = expense.type === 'income';
    const users: Map<Map<MoneyLike>> = {};
    division.forEach(d => { users[d.userId] = { ...users[d.userId], [d.type]: d.sum }; });

    return (
      <DivisionTable>
        <thead>
          {this.renderUserHeaderRow(isIncome)}
        </thead>
        <tbody>
          {Object.keys(users).map(userId => this.renderUser(userId, isIncome, users[userId]))}
        </tbody>
      </DivisionTable>
    );
  }

  private renderUserHeaderRow(isIncome: boolean) {
    return (
      <DivisionRow>
        <UserHeader>Jako:</UserHeader>
        <DivisionHeader>{isIncome ? 'Tulo' : 'Kulu'}</DivisionHeader>
        <DivisionHeader>{isIncome ? 'Jako' : 'Hyöty'}</DivisionHeader>
        <DivisionHeader>Balanssi</DivisionHeader>
      </DivisionRow>
    );
  }

  private renderUser(userId: string, isIncome: boolean, user: Map<MoneyLike>) {
    return (
      <DivisionRow key={userId}>
        <UserColumn><UserAvatar userId={parseInt(userId, 10)} size={32} /></UserColumn>
        <DivisionItem sum={isIncome ? user.income : user.cost} />
        <DivisionItem sum={isIncome ? user.split : user.benefit} />
        <DivisionItem sum={getBalance(user)} />
      </DivisionRow>
    );
  }

}

function getBalance(data: Map<MoneyLike>) {
  return divisionTypes.map(t => Money.orZero(data[t])).reduce((a, b) => a.plus(b), Money.zero).negate();
}

function DivisionItem({ sum }: { sum: MoneyLike }) {
  const s = Money.orZero(sum);
  return <DivisionColumn className={Money.sign(s)}>{s.format()}</DivisionColumn>;
}

const DivisionTable = styled.table`
  margin: 0 10px;
  padding: 0;
  border-collapse: collapse;
  ${media.small`
    width: calc(100% - 20px);
  `}
`;

const DivisionRow = styled.tr`
  padding: 0;
`;

const UserColumn = styled.td`
  width: 32px;
  height: 32px;
  padding: 8px;
  padding-left: 24px;
`;

const DivisionColumn = styled.td`
  width: 86px;
  text-align: right;
  &.positive { color: ${colors.positive}; }
  &.negative { color: ${colors.negative}; }
  &.zero { color: ${colors.unimportant}; }
  &:last-of-type {
    padding-right: 24px;
  }
`;

const UserHeader = UserColumn.withComponent('th');
const DivisionHeader = DivisionColumn.withComponent('th');
