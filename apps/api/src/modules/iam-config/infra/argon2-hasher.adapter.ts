import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasherPort } from '../domain/password-hasher.port';

@Injectable()
export class Argon2HasherAdapter implements PasswordHasherPort {
  private readonly options: argon2.HashOptions = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 4,
  };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}