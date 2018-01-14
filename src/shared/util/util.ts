export function ucFirst(str: any): string {
    return typeof str === 'string' && str.length > 0 ? (str.charAt(0).toUpperCase() + str.substr(1)) : '';
}

export function underscoreToCamelCase(str: any): string {
    if (typeof str !== 'string') { return ''; }
    if (str.length < 2) { return str; }
    return str.split('_').map((v, i) => (i === 0) ? v : ucFirst(v)).join('');
}

export function camelCaseObject(o: Map<string>): Map<string> {
    if (typeof o !== 'object') { return o; }
    const r: Map<string> = {};
    Object.keys(o).forEach(k => r[underscoreToCamelCase(k)] = o[k]);
    return r;
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function identity<T>(x: T): T {
    return x;
}

export async function asyncIdentity<T>(x: T): Promise<T> {
    return x;
}

export interface Map<T> {
    [key: string]: T;
}

export interface NumberMap<T> {
    [key: number]: T;
}
