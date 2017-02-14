"use strict";

export function unsubscribeAll(arr) {
    arr.forEach(i => {
        if (typeof i === "function") i();
        else if (typeof i.end === "function") i.end();
    })
}
