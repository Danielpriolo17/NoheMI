import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/infra/redis.service';
import {
  ActiveSessionPayload,
  SessionStorePort,
  SupervisorOverrideTokenPayload,
} from '../domain/security.ports';

@Injectable()
export class RedisSessionStore implements SessionStorePort {
  private readonly sessionPrefix = 'nohemi:session:';
  private readonly overridePrefix = 'nohemi:override:';

  constructor(private readonly redis: RedisService) {}

  async saveActiveSession(
    sessionId: string,
    payload: ActiveSessionPayload,
    idleTtlSeconds: number,
  ): Promise<void> {
    await this.redis.client.set(
      `${this.sessionPrefix}${sessionId}`,
      JSON.stringify(payload),
      'EX',
      idleTtlSeconds,
    );
  }

  async touchActiveSession(
    sessionId: string,
    idleTtlSeconds: number,
  ): Promise<ActiveSessionPayload | null> {
    const key = `${this.sessionPrefix}${sessionId}`;
    const raw = await this.redis.client.get(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ActiveSessionPayload;
    const updated: ActiveSessionPayload = {
      ...parsed,
      lastSeenAt: new Date().toISOString(),
    };
    await this.redis.client.set(key, JSON.stringify(updated), 'EX', idleTtlSeconds);
    return updated;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.redis.client.del(`${this.sessionPrefix}${sessionId}`);
  }

  async saveOverrideToken(
    token: string,
    payload: SupervisorOverrideTokenPayload,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.client.set(
      `${this.overridePrefix}${token}`,
      JSON.stringify(payload),
      'EX',
      ttlSeconds,
    );
  }

  async consumeOverrideToken(
    token: string,
  ): Promise<SupervisorOverrideTokenPayload | null> {
    const key = `${this.overridePrefix}${token}`;
    // Operación atómica getdel: garantiza uso único (one-time token)
    const raw = await this.redis.client.getdel(key);
    if (!raw) return null;
    return JSON.parse(raw) as SupervisorOverrideTokenPayload;
  }
}