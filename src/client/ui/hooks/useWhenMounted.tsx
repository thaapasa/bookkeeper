import { Unsubscriber } from 'client/util/ClientUtil';

import { useOnUnmount } from './useOnUnmount';
import { usePersistentMemo } from './usePersistentMemo';

/**
 * Runs the given setup code once when the parent is mounted
 * (during the render operation), and runs the unsubscriber function returned
 * from the setup function when the parent unmounts.
 */
export function useWhenMounted<F extends () => Unsubscriber | undefined>(f: F, deps: any[]): void {
  const unsub = usePersistentMemo(f, deps);
  useOnUnmount(() => {
    if (typeof unsub === 'function') unsub();
    else unsub?.end();
  }, deps);
}
