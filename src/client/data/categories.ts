import * as state from './state';
import { flatten } from '../../shared/util/arrays';
import { Category } from '../../shared/types/session';

export function getFullName(categoryId: number): string {
    let categoryString = '';
    const category = state.get('categoryMap')[categoryId];
    if (category.parentId)
        categoryString += getFullName(category.parentId) + ' - ' ;
    categoryString += category.name;
    return categoryString;
}

export function get(categoryId): Category {
    return state.get('categoryMap')[categoryId];
}

function catToDataSource(arr: any[]): any[] {
    return arr ? flatten(arr.map(c => ([{ value: c.id, text: getFullName(c.id) }].concat(catToDataSource(c.children))))) :
    [];
}

export function getDataSource() {
    return catToDataSource(state.get('categories'));
}

export function isSubcategoryOf(subId: number, parentId: number): boolean {
    const map = state.get('categoryMap');
    const sub = map[subId];
    return sub && sub.parentId === parentId;
}
