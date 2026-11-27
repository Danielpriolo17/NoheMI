import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { PrismaService } from './infra/prisma.service';
import { REDIS_CLIENT, redisProvider } from './infra/redis.provider';
import { AUDIT_PORT } from './domain/audit.port';
import { PrismaAuditAdapter } from './infra/prisma-audit.adapter';

@Global()
@Module({
  providers: [
    PrismaService,
    redisProvider,
    {
      provide: AUDIT_PORT,
      useClass: PrismaAuditAdapter,
    },
  ],
  exports: [PrismaService, REDIS_CLIENT, AUDIT_PORT],
})
export class SharedModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}