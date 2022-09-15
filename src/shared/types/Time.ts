import { z } from 'zod';

import { IntString } from './Primitives';

export const YearMonth = z.object({
  year: IntString.refine(r => r >= 1500 && r <= 3000),
  month: IntString.refine(r => r >= 1 && r <= 12),
});
export type YearMonth = z.infer<typeof YearMonth>;
