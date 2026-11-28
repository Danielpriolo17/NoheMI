import { HttpException } from '@nestjs/common';
import { DomainError } from '../domain/domain-error';
import { Result } from '../domain/result';

export function unwrapOrThrowHttp<T>(result: Result<T, DomainError>): T {
  return result.match({
    ok: (value) => value,
    err: (error) => {
      throw new HttpException(
        {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
        error.httpStatus,
      );
    },
  });
}