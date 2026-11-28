import { DomainError } from '../domain/domain-error';
import { Result } from '../domain/result';
export declare function unwrapOrThrowHttp<T>(result: Result<T, DomainError>): T;
