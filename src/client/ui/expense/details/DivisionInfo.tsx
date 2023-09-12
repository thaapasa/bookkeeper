import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseDivisionItem, ExpenseDivisionType, ExpenseType } from 'shared/expense';
import { Money, MoneyLike } from 'shared/util';
import * as colors from 'client/ui/Colors';
import UserAvatar from 'client/ui/component/UserAvatar';
import { media } from 'client/ui/Styles';

interface DivisionInfoProps {
  division: ExpenseDivisionItem[];
  expenseType: ExpenseType;
}

const divisionTypes = ['cost', 'benefit', 'income', 'split', 'transferor', 'transferee'];

function getBalance(data: Record<string, MoneyLike>) {
  return divisionTypes
    .map(t => Money.orZero(data[t]))
    .reduce((a, b) => a.plus(b), Money.zero)
    .negate();
}

type ShownColumns = ExpenseDivisionType[];
const ColumnData: Record<ExpenseType, ShownColumns> = {
  income: ['income', 'split'],
  expense: ['cost', 'benefit'],
  transfer: ['transferor', 'transferee'],
};

const ColumnLabels: Record<ExpenseDivisionType, string> = {
  income: 'Tulo',
  split: 'Jako',
  cost: 'Meno',
  benefit: 'Hyöty',
  transferor: 'Annettu',
  transferee: 'Saatu',
};

export const DivisionInfo: React.FC<DivisionInfoProps> = ({ division, expenseType }) => {
  const users: Record<string, Record<ExpenseDivisionType, MoneyLike>> = {};
  division.forEach(d => {
    users[d.userId] = { ...users[d.userId], [d.type]: d.sum };
  });

  const cols = ColumnData[expenseType];
  return (
    <DivisionTable>
      <thead>
        <UserHeaderRow cols={cols} />
      </thead>
      <tbody>
        {Object.keys(users).map(userId => (
          <DivisionUser userId={userId} cols={cols} userDivision={users[userId]} key={userId} />
        ))}
      </tbody>
    </DivisionTable>
  );
};

const UserHeaderRow: React.FC<{
  cols: ShownColumns;
}> = ({ cols }) => (
  <DivisionRow>
    <UserColumn as="th">Jako:</UserColumn>
    {cols.map(c => (
      <DivisionColumn as="th" key={c}>
        {ColumnLabels[c]}
      </DivisionColumn>
    ))}
    <DivisionColumn as="th">Balanssi</DivisionColumn>
  </DivisionRow>
);

const DivisionUser: React.FC<{
  userId: string;
  cols: ShownColumns;
  userDivision: Record<ExpenseDivisionType, MoneyLike>;
}> = ({ userId, cols, userDivision }) => (
  <DivisionRow key={userId}>
    <UserColumn>
      <UserAvatar userId={parseInt(userId, 10)} size={32} />
    </UserColumn>
    {cols.map(c => (
      <DivisionItem key={c} sum={userDivision[c]} />
    ))}
    <DivisionItem sum={getBalance(userDivision)} />
  </DivisionRow>
);

const DivisionItem: React.FC<{ sum: MoneyLike }> = ({ sum }) => {
  const s = Money.orZero(sum);
  return <DivisionColumn className={Money.sign(s)}>{s.format()}</DivisionColumn>;
};

const DivisionTable = styled('table')`
  margin: 0 8px;
  padding: 0;
  border-collapse: collapse;
  ${media.mobilePortrait`
    width: calc(100% - 20px);
  `}
`;

const DivisionRow = styled('tr')`
  padding: 0;
`;

const UserColumn = styled('td')`
  width: 32px;
  height: 32px;
  padding: 8px;
  padding-left: 24px;
`;

const DivisionColumn = styled('td')`
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
