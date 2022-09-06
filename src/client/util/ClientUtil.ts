export type UnsubscribingFunction = () => void;
export type Unsubscriber = UnsubscribingFunction | { end: () => void };

export function unsubscribeAll(arr: Unsubscriber[]): void {
  arr.forEach(i => {
    if (typeof i === 'function') {
      i();
    } else if (typeof i.end === 'function') {
      i.end();
    }
  });
  arr.splice(0, arr.length);
}

export function stopEventPropagation(event: any): void {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
}

export function eventValue(
  e: string | React.ChangeEvent<{ value: string }>
): string {
  return (typeof e === 'string' ? e : e.target.value) || '';
}
