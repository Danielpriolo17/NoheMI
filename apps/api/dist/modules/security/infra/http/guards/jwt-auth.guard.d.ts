import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SecurityRepositoryPort, SessionStorePort } from '../../../domain/security.ports';
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwtService;
    private readonly config;
    private readonly sessionStore;
    private readonly securityRepo;
    constructor(reflector: Reflector, jwtService: JwtService, config: ConfigService, sessionStore: SessionStorePort, securityRepo: SecurityRepositoryPort);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
