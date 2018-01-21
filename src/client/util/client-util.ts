"use strict";

export function unsubscribeAll(arr: any[]): void {
    arr.forEach(i => {
        if (typeof i === "function") i();
        else if (typeof i.end === "function") i.end();
    })
}

export function combineClassNames(...classNames: (string | undefined)[]): string {
    const names: string[] = classNames.filter(i => i !== undefined) as string[];
    return names.reduce((res, cur) => cur ? (res ? res + " " + cur : cur) : res, "");
}

export function stopEventPropagation(event: any): void {
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }
}