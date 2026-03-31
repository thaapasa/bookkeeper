import { Table, TableProps } from '@mantine/core';
import * as React from 'react';

import { ExpenseDivisionItem, ExpenseDivisionType, ExpenseType } from 'shared/expense';
import { Money, MoneyLike } from 'shared/util';
import { UserIdAvatar } from 'client/ui/component/UserAvatar';

type DivisionInfoProps = {
  division: ExpenseDivisionItem[];
  expenseType: ExpenseType;
} & TableProps;

const divisionTypes = ['cost', 'benefit', 'income', 'split', 'transferor', 'transferee'];

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

const signColor: Record<string, string | undefined> = {
  positive: undefined,
  negative: 'red',
  zero: 'dimmed',
};

export const DivisionInfo: React.FC<DivisionInfoProps> = ({ division, expenseType, ...props }) => {
  const users: Record<string, Record<ExpenseDivisionType, MoneyLike>> = {};
  division.forEach(d => {
    users[d.userId] = { ...users[d.userId], [d.type]: d.sum };
  });

  const cols = ColumnData[expenseType];
  return (
    <Table p={0} withRowBorders={false} withTableBorder={false} w="fit-content" {...props}>
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
    <Table.Th w={80}>Jako:</Table.Th>
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
  <Table.Tr>
    <Table.Td w={32}>
      <UserIdAvatar userId={parseInt(userId, 10)} size={32} />
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
    <Table.Td ta="right" pr={isLast ? 'lg' : undefined} c={signColor[Money.sign(s)]}>
      {s.format()}
    </Table.Td>
  );
};

function getBalance(data: Record<string, MoneyLike>) {
  return divisionTypes
    .map(t => Money.orZero(data[t]))
    .reduce((a, b) => a.plus(b), Money.zero)
    .negate();
}
