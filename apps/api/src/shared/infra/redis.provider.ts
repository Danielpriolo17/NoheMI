import { Logger, Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
    const logger = new Logger('RedisProvider');
    const client = new Redis({
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