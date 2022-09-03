import { z } from 'zod';

import { IntStringZ } from './Validator';

export const YearMonth = z.object({
  year: IntStringZ.refine(r => r >= 1500 && r <= 3000),
  month: IntStringZ.refine(r => r >= 1 && r <= 12),
});
export type YearMonth = z.infer<typeof YearMonth>;
