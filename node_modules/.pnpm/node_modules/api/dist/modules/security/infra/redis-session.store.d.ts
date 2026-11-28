import { RedisService } from '../../../shared/infra/redis.service';
import { ActiveSessionPayload, SessionStorePort, SupervisorOverrideTokenPayload } from '../domain/security.ports';
export declare class RedisSessionStore implements SessionStorePort {
    private readonly redis;
    private readonly sessionPrefix;
    private readonly overridePrefix;
    constructor(redis: RedisService);
    saveActiveSession(sessionId: string, payload: ActiveSessionPayload, idleTtlSeconds: number): Promise<void>;
    touchActiveSession(sessionId: string, idleTtlSeconds: number): Promise<ActiveSessionPayload | null>;
    revokeSession(sessionId: string): Promise<void>;
    saveOverrideToken(token: string, payload: SupervisorOverrideTokenPayload, ttlSeconds: number): Promise<void>;
    consumeOverrideToken(token: string): Promise<SupervisorOverrideTokenPayload | null>;
}
