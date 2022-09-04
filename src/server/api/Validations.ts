import { z } from 'zod';

import { ObjectIdString } from 'shared/types/Id';

export const IdParamType = z.object({ id: ObjectIdString });
