import { Global, Module } from '@nestjs/common';
import { AUDIT_LOGGER_PORT, UNIT_OF_WORK_PORT } from '../application/ports';
import { PrismaAuditLogger } from './prisma-audit-logger';
import { PrismaService } from './prisma.service';
import { PrismaUnitOfWork } from './prisma-unit-of-work';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    PrismaService,
    RedisService,
    { provide: UNIT_OF_WORK_PORT, useClass: PrismaUnitOfWork },
    { provide: AUDIT_LOGGER_PORT, useClass: PrismaAuditLogger },
  ],
  exports: [
    PrismaService,
    RedisService,
    UNIT_OF_WORK_PORT,
    AUDIT_LOGGER_PORT,
  ],
})
export class SharedModule {}