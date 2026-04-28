import * as React from 'react';

import { RecurrenceInterval } from 'shared/time';

const SubscriptionRangeContext = React.createContext<RecurrenceInterval | undefined>(undefined);

/**
 * Shares the active baseline range with descendants — chiefly the row
 * expander, which must run `/matches` over the same window the page's
 * `/search` used. Lifts the value out of prop drilling so a future
 * intermediate component can't silently drop it and revert to the 5y
 * default, leaving the expander's totals out of sync with the card's.
 */
export const SubscriptionRangeProvider: React.FC<{
  range: RecurrenceInterval | undefined;
  children: React.ReactNode;
}> = ({ range, children }) => (
  <SubscriptionRangeContext.Provider value={range}>{children}</SubscriptionRangeContext.Provider>
);

export function useSubscriptionRange(): RecurrenceInterval | undefined {
  return React.useContext(SubscriptionRangeContext);
}
