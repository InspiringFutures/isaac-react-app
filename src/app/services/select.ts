import {ValueType} from "react-select";

export interface Item<T> {value: T; label: string;}
export function unwrapValue<T>(f: (items: Item<T>[]) => void) {
    return (value: ValueType<Item<T>>) => f(Array.isArray(value) ? value : !value ? [] : [value]);
}
export function isItemEqual<T>(valueComparisonFunction: (x: T, y: T) => boolean, a: Item<T>, b: Item<T>): boolean {
    return a.label === b.label && valueComparisonFunction(a.value, b.value);
}
