export function unsubscribeAll(arr: any[]): void {
  arr.forEach(i => {
    if (typeof i === 'function') {
      i();
    } else if (typeof i.end === 'function') {
      i.end();
    }
  });
  arr.splice(0, arr.length);
}

export function combineClassNames(...classNames: Array<string | undefined>): string {
  const names: string[] = classNames.filter(i => i !== undefined) as string[];
  return names.reduce((res, cur) => cur ? (res ? res + ' ' + cur : cur) : res, '');
}

export function stopEventPropagation(event: any): void {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
}
