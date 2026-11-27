import { OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
export declare class SharedModule implements OnModuleDestroy {
    private readonly redis;
    constructor(redis: Redis);
    onModuleDestroy(): Promise<void>;
}
