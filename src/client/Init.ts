import 'dayjs/locale/fi';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.locale('fi');
dayjs.extend(isoWeek);
