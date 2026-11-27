export type Result<T, E> = Ok<T, E> | Err<T, E>;
export declare class Ok<T, E> {
    readonly value: T;
    readonly isOk = true;
    readonly isErr = false;
    constructor(value: T);
    map<U>(fn: (value: T) => U): Result<U, E>;
    andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
}
export declare class Err<T, E> {
    readonly error: E;
    readonly isOk = false;
    readonly isErr = true;
    constructor(error: E);
    map<U>(_fn: (value: T) => U): Result<U, E>;
    andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E>;
}
export declare const ok: <T, E = never>(value: T) => Result<T, E>;
export declare const err: <T = never, E = unknown>(error: E) => Result<T, E>;
