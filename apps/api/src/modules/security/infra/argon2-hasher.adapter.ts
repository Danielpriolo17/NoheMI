import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasherPort } from '../domain/security.ports';

@Injectable()
export class Argon2HasherAdapter implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MiB
      timeCost: 3,
      parallelism: 1,
    });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}