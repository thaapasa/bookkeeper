"use strict";

import * as state from "./state";
import {flatten} from "../../shared/util/arrays"

export function getFullName(categoryId) {
    let categoryString = "";
    const category = state.get("categoryMap")[categoryId];
    if (category.parentId)
        categoryString += getFullName(category.parentId) + " - " ;
    categoryString += category.name;
    return categoryString;
}

const catToDataSource = (arr) => arr ?
    flatten(arr.map(c => ([{ value: c.id, text: getFullName(c.id) }].concat(catToDataSource(c.children))))) :
    [];

export function getDataSource() {
    return catToDataSource(state.get("categories"));
}
