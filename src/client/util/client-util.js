"use strict";

export function unsubscribeAll(arr) {
    arr.forEach(i => {
        if (typeof i === "function") i();
        else if (typeof i.end === "function") i.end();
    })
}

export function combineClassNames() {
    return Array.prototype.slice.call(arguments).reduce((res, cur) => cur ? (res ? res + " " + cur : cur) : res, "");
}

export function stopEventPropagation(event) {
    event && event.stopPropagation();
}
