import { z } from 'zod';

import { IntStringZ } from 'shared/types/Validator';

export const IdType = z.object({ id: IntStringZ });
export const ExpenseIdType = z.object({ expenseId: IntStringZ });
