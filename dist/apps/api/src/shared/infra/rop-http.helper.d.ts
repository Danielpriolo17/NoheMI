import { Result } from '../domain/result';
import { DomainError } from '../domain/domain-error';
export declare function unwrapOrThrowHttp<T>(result: Result<T, DomainError>): T;
