import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransactionClient, UnitOfWorkPort } from '../application/ports';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    work: (tx: TransactionClient) => Promise<T>,
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
      timeoutMs?: number;
    },
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx), {
      isolationLevel:
        options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: options?.timeoutMs ?? 15000,
    });
  }
}