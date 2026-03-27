import { Table } from '@mantine/core';
import * as React from 'react';

import { ExpenseDivisionItem, ExpenseDivisionType, ExpenseType } from 'shared/expense';
import { Money, MoneyLike } from 'shared/util';
import { negative, positive, unimportant } from 'client/ui/Colors';
import UserAvatar from 'client/ui/component/UserAvatar';

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

const signColor: Record<string, string> = {
  positive,
  negative,
  zero: unimportant,
};

export const DivisionInfo: React.FC<DivisionInfoProps> = ({ division, expenseType }) => {
  const users: Record<string, Record<ExpenseDivisionType, MoneyLike>> = {};
  division.forEach(d => {
    users[d.userId] = { ...users[d.userId], [d.type]: d.sum };
  });

  const cols = ColumnData[expenseType];
  return (
    <Table
      mx="xs"
      p={0}
      withRowBorders={false}
      withTableBorder={false}
      style={{ maxWidth: 'fit-content' }}
    >
      <Table.Thead>
        <UserHeaderRow cols={cols} />
      </Table.Thead>
      <Table.Tbody>
        {Object.keys(users).map(userId => (
          <DivisionUser userId={userId} cols={cols} userDivision={users[userId]} key={userId} />
        ))}
      </Table.Tbody>
    </Table>
  );
};

const UserHeaderRow: React.FC<{
  cols: ShownColumns;
}> = ({ cols }) => (
  <Table.Tr>
    <Table.Th w={32} style={{ padding: '8px 8px 8px 24px' }}>
      Jako:
    </Table.Th>
    {cols.map(c => (
      <Table.Th w={86} ta="right" key={c}>
        {ColumnLabels[c]}
      </Table.Th>
    ))}
    <Table.Th w={86} ta="right" pr="lg">
      Balanssi
    </Table.Th>
  </Table.Tr>
);

const DivisionUser: React.FC<{
  userId: string;
  cols: ShownColumns;
  userDivision: Record<ExpenseDivisionType, MoneyLike>;
}> = ({ userId, cols, userDivision }) => (
  <Table.Tr key={userId}>
    <Table.Td w={32} style={{ padding: '8px 8px 8px 24px' }}>
      <UserAvatar userId={parseInt(userId, 10)} size={32} />
    </Table.Td>
    {cols.map(c => (
      <DivisionItem key={c} sum={userDivision[c]} />
    ))}
    <DivisionItem sum={getBalance(userDivision)} isLast />
  </Table.Tr>
);

const DivisionItem: React.FC<{ sum: MoneyLike; isLast?: boolean }> = ({ sum, isLast }) => {
  const s = Money.orZero(sum);
  return (
    <Table.Td
      w={86}
      ta="right"
      pr={isLast ? 'lg' : undefined}
      style={{ color: signColor[Money.sign(s)] }}
    >
      {s.format()}
    </Table.Td>
  );
};
