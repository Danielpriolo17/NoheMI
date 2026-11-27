import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { AuditEntryInput, AuditPort } from '../domain/audit.port';

type AuditClient = Pick<PrismaService, 'auditLog'>;

@Injectable()
export class PrismaAuditAdapter implements AuditPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntryInput, tx?: AuditClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        terminalId: entry.terminalId,
        module: entry.module,
        action: entry.action,
        documentType: entry.documentType,
        documentId: entry.documentId,
        beforeState: (entry.beforeState as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        afterState: (entry.afterState as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }
}