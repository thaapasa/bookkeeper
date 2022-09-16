import { z } from 'zod';

import { ObjectIdString } from 'shared/types';

export const IdParamType = z.object({ id: ObjectIdString });
