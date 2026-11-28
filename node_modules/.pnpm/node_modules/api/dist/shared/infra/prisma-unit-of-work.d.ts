import { Prisma } from '@prisma/client';
import { TransactionClient, UnitOfWorkPort } from '../application/ports';
import { PrismaService } from './prisma.service';
export declare class PrismaUnitOfWork implements UnitOfWorkPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    runInTransaction<T>(work: (tx: TransactionClient) => Promise<T>, options?: {
        isolationLevel?: Prisma.TransactionIsolationLevel;
        timeoutMs?: number;
    }): Promise<T>;
}
