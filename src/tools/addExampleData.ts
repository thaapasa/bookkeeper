import debug from 'debug';

import { ExpenseData } from 'shared/expense';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { toISODate, toMoment } from 'shared/time';
import { ApiMessage } from 'shared/types';
import { unnest } from 'shared/util';

const client = createTestClient();
const log = debug('bookkeeper:data:example');

/* eslint-disable @typescript-eslint/no-non-null-assertion */

async function addExampleData() {
  log('Adding example data to database');
  const session = await client.getSession('sale', 'salasana');
  const allCategories = [
    ...session.categories,
    ...unnest(session.categories.map(c => c.children)),
  ];
  const foodC = allCategories.find(c => c.name === 'Ruokakauppa')!;
  const detbC = allCategories.find(c => c.name === 'Lainanhoito')!;
  const saleS = session.sources.find(s => s.name.includes('Sale'))!;
  const commonS = session.sources.find(s => s.name.includes('Yhteinen'))!;

  const defaultExpense: ExpenseData = {
    title: 'Ostoksia',
    categoryId: foodC.id,
    confirmed: true,
    description: '',
    date: toISODate(),
    receiver: 'Prisma Sello',
    sum: '47.22',
    userId: session.user.id,
    type: 'expense',
    sourceId: saleS.id,
  };

  async function addExpense(
    expense: Partial<ExpenseData>,
    session: SessionWithControl
  ) {
    const data = { ...defaultExpense, ...expense };
    return session.put<ApiMessage>('/api/expense', data);
  }

  await addExpense({}, session);
  const debtE = await addExpense(
    {
      title: 'Asuntolainan lyhennys',
      categoryId: detbC.id,
      receiver: 'Danske Bank',
      sum: '1570',
      sourceId: commonS.id,
      date: toISODate(toMoment().subtract(2, 'year')),
    },
    session
  );
  await session.put(`/api/expense/recurring/${debtE.expenseId}`, {
    period: { amount: 1, unit: 'months' },
  });
  await session.logout();
  log('Example data created');
}

addExampleData().catch(e => log('Error when adding example data', e));
