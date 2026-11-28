import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AuditEntryInput,
  AuditLoggerPort,
  TransactionClient,
} from '../application/ports';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAuditLogger implements AuditLoggerPort {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntryInput, tx?: TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        supervisorId: entry.supervisorId ?? null,
        branchId: entry.branchId ?? null,
        terminalId: entry.terminalId ?? null,
        ipAddress: entry.ipAddress ?? null,
        module: entry.module,
        action: entry.action,
        entityName: entry.entityName,
        entityId: entry.entityId,
        beforeData: entry.beforeData
          ? (entry.beforeData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        afterData: entry.afterData
          ? (entry.afterData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        metadata: entry.metadata
          ? (entry.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }
}