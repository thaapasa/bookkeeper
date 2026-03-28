export function classNames(...names: (string | undefined | null)[]): string {
  return names.filter(Boolean).map(String).join(' ');
}
