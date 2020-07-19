export interface DbObject {
  id: number;
}

export function isDbObject(e: any): e is DbObject {
  return isDefined(e) && typeof e === 'object' && typeof e.id === 'number';
}

export function isDefined<T>(x: T | undefined | null): x is T {
  return x !== undefined && x !== null;
}

export type Action = () => void;

export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
export type Timeout = ReturnType<typeof setTimeout>;
