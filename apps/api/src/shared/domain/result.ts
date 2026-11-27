export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly isOk = true;
  readonly isErr = false;

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
}

export class Err<T, E> {
  readonly isOk = false;
  readonly isErr = true;

  constructor(readonly error: E) {}

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return err(this.error);
  }

  andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return err(this.error);
  }
}

export const ok = <T, E = never>(value: T): Result<T, E> => new Ok(value);
export const err = <T = never, E = unknown>(error: E): Result<T, E> => new Err(error);