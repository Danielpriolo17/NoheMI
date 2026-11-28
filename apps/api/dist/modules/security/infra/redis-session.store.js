"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSessionStore = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../../shared/infra/redis.service");
let RedisSessionStore = class RedisSessionStore {
    redis;
    sessionPrefix = 'nohemi:session:';
    overridePrefix = 'nohemi:override:';
    constructor(redis) {
        this.redis = redis;
    }
    async saveActiveSession(sessionId, payload, idleTtlSeconds) {
        await this.redis.client.set(`${this.sessionPrefix}${sessionId}`, JSON.stringify(payload), 'EX', idleTtlSeconds);
    }
    async touchActiveSession(sessionId, idleTtlSeconds) {
        const key = `${this.sessionPrefix}${sessionId}`;
        const raw = await this.redis.client.get(key);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        const updated = {
            ...parsed,
            lastSeenAt: new Date().toISOString(),
        };
        await this.redis.client.set(key, JSON.stringify(updated), 'EX', idleTtlSeconds);
        return updated;
    }
    async revokeSession(sessionId) {
        await this.redis.client.del(`${this.sessionPrefix}${sessionId}`);
    }
    async saveOverrideToken(token, payload, ttlSeconds) {
        await this.redis.client.set(`${this.overridePrefix}${token}`, JSON.stringify(payload), 'EX', ttlSeconds);
    }
    async consumeOverrideToken(token) {
        const key = `${this.overridePrefix}${token}`;
        const raw = await this.redis.client.getdel(key);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
};
exports.RedisSessionStore = RedisSessionStore;
exports.RedisSessionStore = RedisSessionStore = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RedisSessionStore);
//# sourceMappingURL=redis-session.store.js.map