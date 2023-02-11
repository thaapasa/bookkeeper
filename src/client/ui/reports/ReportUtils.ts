import { ExpenseQuery } from 'shared/expense';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';

import { UserPrompts } from '../dialog/DialogState';

export async function requestSaveReport(query: ExpenseQuery) {
  const title = await UserPrompts.promptText(
    'Raportti',
    'Anna raportille nimi'
  );
  if (!title) return;
  await executeOperation(apiConnect.createReport(title, query), {
    success: 'Raportti luotu',
  });
}
