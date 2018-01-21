export interface DbObject {
    id: number;
};

export function isDbObject(e: any): e is DbObject {
    return typeof e === 'object' && typeof e.id === 'number';
}