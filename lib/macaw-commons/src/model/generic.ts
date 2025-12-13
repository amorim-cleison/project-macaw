export type DynamicObject<T> = { [name: string]: T };

export type Dictionary<K extends keyof any, T> = {
    [P in K]: T;
};