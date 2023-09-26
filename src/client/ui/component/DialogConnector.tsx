import * as B from 'baconjs';
import * as React from 'react';

export function connectDialog<T>(
  bus: B.EventStream<T>,
  renderer: React.ComponentType<T & { onClose: () => void }>,
) {
  return (() => {
    // Track last event from renderer
    const [state, setState] = React.useState<T | undefined>(undefined);
    // Update state when an event is pushed to stream
    React.useEffect(() => bus.onValue(setState), []);
    // Clear state when closed
    const onClose = React.useCallback(() => setState(undefined), [setState]);
    const DialogRenderer = renderer;
    return state ? <DialogRenderer {...state} onClose={onClose} /> : null;
  }) satisfies React.FC;
}
