export interface DbObject {
  id: number;
}

export function isDbObject(e: any): e is DbObject {
  return typeof e === 'object' && typeof e.id === 'number';
}

export type Action = () => void;

export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
export type Timeout = ReturnType<typeof setTimeout>;
