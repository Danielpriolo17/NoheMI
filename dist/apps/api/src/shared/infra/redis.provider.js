"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisProvider = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
exports.REDIS_CLIENT = Symbol('REDIS_CLIENT');
exports.redisProvider = {
    provide: exports.REDIS_CLIENT,
    useFactory: () => {
        const logger = new common_1.Logger('RedisProvider');
        const client = new ioredis_1.default({
            host: process.env.REDIS_HOST ?? '127.0.0.1',
            port: Number(process.env.REDIS_PORT ?? 6379),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 200, 3000),
        });
        client.on('connect', () => logger.log('Conexión con Redis establecida.'));
        client.on('error', (err) => logger.error(`Error en Redis: ${err.message}`));
        return client;
    },
};
//# sourceMappingURL=redis.provider.js.map