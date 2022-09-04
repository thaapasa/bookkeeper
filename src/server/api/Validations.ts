import { z } from 'zod';

import { IntString } from 'shared/types/Validator';

export const IdType = z.object({ id: IntString });
export const ExpenseIdType = z.object({ expenseId: IntString });
