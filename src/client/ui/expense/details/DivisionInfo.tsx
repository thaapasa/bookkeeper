import * as React from 'react';
import styled from 'styled-components';
import * as colors from 'client/ui/Colors';
import UserAvatar from 'client/ui/component/UserAvatar';
import Money, { MoneyLike } from 'shared/util/Money';
import {
  ExpenseDivisionItem,
  ExpenseDivisionType,
  ExpenseType,
} from 'shared/types/Expense';
import { media } from 'client/ui/Styles';

interface DivisionInfoProps {
  division: ExpenseDivisionItem[];
  expenseType: ExpenseType;
}

const divisionTypes = ['cost', 'benefit', 'income', 'split'];

function getBalance(data: Record<string, MoneyLike>) {
  return divisionTypes
    .map(t => Money.orZero(data[t]))
    .reduce((a, b) => a.plus(b), Money.zero)
    .negate();
}

export const DivisionInfo = ({ division, expenseType }: DivisionInfoProps) => {
  const isIncome = expenseType === 'income';
  const users: Record<string, Record<ExpenseDivisionType, MoneyLike>> = {};
  division.forEach(d => {
    users[d.userId] = { ...users[d.userId], [d.type]: d.sum };
  });

  return (
    <DivisionTable>
      <thead>
        <UserHeaderRow isIncome={isIncome} />
      </thead>
      <tbody>
        {Object.keys(users).map(userId => (
          <DivisionUser
            userId={userId}
            isIncome={isIncome}
            userDivision={users[userId]}
            key={userId}
          />
        ))}
      </tbody>
    </DivisionTable>
  );
};

const UserHeaderRow = ({ isIncome }: { isIncome: boolean }) => (
  <DivisionRow>
    <UserColumn as="th">Jako:</UserColumn>
    <DivisionColumn as="th">{isIncome ? 'Tulo' : 'Kulu'}</DivisionColumn>
    <DivisionColumn as="th">{isIncome ? 'Jako' : 'Hyöty'}</DivisionColumn>
    <DivisionColumn as="th">Balanssi</DivisionColumn>
  </DivisionRow>
);

const DivisionUser = ({
  userId,
  isIncome,
  userDivision,
}: {
  userId: string;
  isIncome: boolean;
  userDivision: Record<ExpenseDivisionType, MoneyLike>;
}) => (
  <DivisionRow key={userId}>
    <UserColumn>
      <UserAvatar userId={parseInt(userId, 10)} size={32} />
    </UserColumn>
    <DivisionItem sum={isIncome ? userDivision.income : userDivision.cost} />
    <DivisionItem sum={isIncome ? userDivision.split : userDivision.benefit} />
    <DivisionItem sum={getBalance(userDivision)} />
  </DivisionRow>
);

function DivisionItem({ sum }: { sum: MoneyLike }) {
  const s = Money.orZero(sum);
  return (
    <DivisionColumn className={Money.sign(s)}>{s.format()}</DivisionColumn>
  );
}

const DivisionTable = styled.table`
  margin: 0 8px;
  padding: 0;
  border-collapse: collapse;
  ${media.mobilePortrait`
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
  &.positive {
    color: ${colors.positive};
  }
  &.negative {
    color: ${colors.negative};
  }
  &.zero {
    color: ${colors.unimportant};
  }
  &:last-of-type {
    padding-right: 24px;
  }
`;
