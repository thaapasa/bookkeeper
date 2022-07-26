import debug from 'debug';

import { ApiMessage } from 'shared/types/Api';
import { ExpenseData } from 'shared/types/Expense';
import { unnest } from 'shared/util/Arrays';
import * as client from 'shared/util/test/TestClient';
import { toISODate, toMoment } from 'shared/util/Time';

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
    session: client.SessionWithControl
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
    period: 'monthly',
  });
  await session.logout();
  log('Example data created');
}

addExampleData().catch(e => log('Error when adding example data', e));
