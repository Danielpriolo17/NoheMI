export interface PasswordHasherPort {
    hash(plain: string): Promise<string>;
    verify(hash: string, plain: string): Promise<boolean>;
}
export declare const PASSWORD_HASHER_PORT: unique symbol;
