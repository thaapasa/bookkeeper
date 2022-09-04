import { z } from 'zod';

import { ObjectId } from 'shared/types/Id';

export const IdType = z.object({ id: ObjectId });
export const ExpenseIdType = z.object({ expenseId: ObjectId });
