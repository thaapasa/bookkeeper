export function ucFirst(str: any): string {
    return typeof str === 'string' && str.length > 0 ? (str.charAt(0).toUpperCase() + str.substr(1)) : '';
}

export function underscoreToCamelCase(str: any): string {
    if (typeof str !== 'string') { return ''; }
    if (str.length < 2) { return str; }
    return str.split('_').map((v, i) => (i === 0) ? v : ucFirst(v)).join('');
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

export interface Map<T> {
    [key: string]: T;
}
