import { BkError } from 'shared/types';
import { db } from 'server/data/Db';

import { INIT_TRACEID, traceIdStorage } from './TraceIdProvider';

/**
 * There seems to be a bug somewhere in the Bun.sh implementation of the AsyncLocalStorage.
 * When a `db.tx` function (from `pg-promise`) throws an error, the current local storage
 * state from the async callback chain leaks into a "global state", so it's actually
 * returned when `traceIdStorage.getStore()` is called from outside any actually tracked
 * async callback chain.
 *
 * This hack is here to put in a magic value to the global state (using the buggy mechanism)
 * so we can recognize it and filter it out.
 *
 * The caveat is that this needs to be call every time after DB transactions are rolled back
 * anywhere in an async callback that is traced using this AsyncLocaLStorage, because those
 * overwrite the "global state value" with the data used for that thread.'
 *
 * This means that some unrelated logging entries that happen outside of the request chain
 * may incorrectly be tagged with the trace id of that request chain, if they occur at the
 * same time an error happens in that request processing (and they are not part of another
 * request chain themselves). This should be rare though.
 */
export async function fixDbTraceLeak() {
  try {
    await traceIdStorage.run(
      { traceId: INIT_TRACEID, startTime: new Date().getTime() },
      async () =>
        await db.task(() => {
          throw new BkError(
            'INIT_GLOBAL_TRACE_ID',
            'This is a hack to leak a known value into the storage that is seen from outside async callbacks',
            500,
          );
        }),
    );
  } catch (e) {
    // Ignore
  }
}
