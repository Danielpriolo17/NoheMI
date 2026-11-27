import { HttpException } from '@nestjs/common';
import { Result } from '../domain/result';
import { DomainError } from '../domain/domain-error';

export function unwrapOrThrowHttp<T>(result: Result<T, DomainError>): T {
  if (result.isOk) return result.value;
  throw new HttpException(
    {
      code: result.error.code,
      message: result.error.message,
      metadata: result.error.metadata ?? null,
    },
    result.error.httpStatus,
  );
}