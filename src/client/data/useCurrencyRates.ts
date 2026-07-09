import { useQuery } from '@tanstack/react-query';

import { apiConnect } from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';

/** Matches the server-side cache window; the ECB publishes only once per working day */
const RATES_STALE_TIME_MS = 4 * 60 * 60 * 1000;

/**
 * Current ECB reference rates, as foreign currency units per 1 EUR.
 *
 * Deliberately a plain `useQuery` rather than `useSuspenseQuery`: a rates outage must
 * degrade only the parts that need rates — the convert buttons, the rates section — and
 * not blank out the expense dialog or the info page around them.
 */
export function useCurrencyRates() {
  const { data, isPending, isError } = useQuery({
    queryKey: QueryKeys.currencies.rates,
    queryFn: () => apiConnect.getCurrencyRates(),
    staleTime: RATES_STALE_TIME_MS,
    retry: 1,
  });

  /** Foreign units per 1 EUR, or undefined when the rate is unknown for this currency */
  const rateFor = (code: string | undefined): string | undefined =>
    code ? data?.rates[code] : undefined;

  return { rates: data, rateFor, isPending, isError };
}
