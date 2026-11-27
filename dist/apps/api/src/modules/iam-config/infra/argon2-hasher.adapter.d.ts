import { PasswordHasherPort } from '../domain/password-hasher.port';
export declare class Argon2HasherAdapter implements PasswordHasherPort {
    private readonly options;
    hash(plain: string): Promise<string>;
    verify(hash: string, plain: string): Promise<boolean>;
}
