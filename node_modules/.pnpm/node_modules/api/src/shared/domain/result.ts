export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly isOk = true as const;
  readonly isErr = false as const;

  constructor(public readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return fn(this.value);
  }

  async flatMapAsync<U, F>(
    fn: (value: T) => Promise<Result<U, F>>,
  ): Promise<Result<U, E | F>> {
    return fn(this.value);
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return handlers.ok(this.value);
  }
}

export class Err<T, E> {
  readonly isOk = false as const;
  readonly isErr = true as const;

  constructor(public readonly error: E) {}

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return err(this.error);
  }

  flatMap<U, F>(_fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return err(this.error);
  }

  async flatMapAsync<U, F>(
    _fn: (value: T) => Promise<Result<U, F>>,
  ): Promise<Result<U, E | F>> {
    return err(this.error);
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return handlers.err(this.error);
  }
}

export const ok = <T, E = never>(value: T): Result<T, E> => new Ok(value);
export const err = <E, T = never>(error: E): Result<T, E> => new Err(error);

export const combineResults = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const r of results) {
    if (r.isErr) return err(r.error);
    values.push(r.value);
  }
  return ok(values);
};