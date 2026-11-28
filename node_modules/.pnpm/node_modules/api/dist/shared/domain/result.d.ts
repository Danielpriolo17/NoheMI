export type Result<T, E> = Ok<T, E> | Err<T, E>;
export declare class Ok<T, E> {
    readonly value: T;
    readonly isOk: true;
    readonly isErr: false;
    constructor(value: T);
    map<U>(fn: (value: T) => U): Result<U, E>;
    flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F>;
    flatMapAsync<U, F>(fn: (value: T) => Promise<Result<U, F>>): Promise<Result<U, E | F>>;
    match<U>(handlers: {
        ok: (value: T) => U;
        err: (error: E) => U;
    }): U;
}
export declare class Err<T, E> {
    readonly error: E;
    readonly isOk: false;
    readonly isErr: true;
    constructor(error: E);
    map<U>(_fn: (value: T) => U): Result<U, E>;
    flatMap<U, F>(_fn: (value: T) => Result<U, F>): Result<U, E | F>;
    flatMapAsync<U, F>(_fn: (value: T) => Promise<Result<U, F>>): Promise<Result<U, E | F>>;
    match<U>(handlers: {
        ok: (value: T) => U;
        err: (error: E) => U;
    }): U;
}
export declare const ok: <T, E = never>(value: T) => Result<T, E>;
export declare const err: <E, T = never>(error: E) => Result<T, E>;
export declare const combineResults: <T, E>(results: Result<T, E>[]) => Result<T[], E>;
