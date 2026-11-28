import { PasswordHasherPort } from '../domain/security.ports';
export declare class Argon2HasherAdapter implements PasswordHasherPort {
    hash(plain: string): Promise<string>;
    verify(hash: string, plain: string): Promise<boolean>;
}
