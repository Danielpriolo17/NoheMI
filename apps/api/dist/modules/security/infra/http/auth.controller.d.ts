import { Request } from 'express';
import { LoginUseCase } from '../../application/login.use-case';
import { SupervisorOverrideUseCase } from '../../application/supervisor-override.use-case';
import { AuthenticatedUser } from '../../domain/auth.types';
import { SessionStorePort } from '../../domain/security.ports';
import { LoginDto, RequestSupervisorOverrideDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly loginUseCase;
    private readonly overrideUseCase;
    private readonly sessionStore;
    constructor(loginUseCase: LoginUseCase, overrideUseCase: SupervisorOverrideUseCase, sessionStore: SessionStorePort);
    login(dto: LoginDto, req: Request): Promise<import("../../application/login.use-case").LoginOutput>;
    logout(user: AuthenticatedUser): Promise<{
        message: string;
    }>;
    getProfile(user: AuthenticatedUser): AuthenticatedUser;
    requestOverride(user: AuthenticatedUser, dto: RequestSupervisorOverrideDto, req: Request): Promise<import("../../application/supervisor-override.use-case").RequestOverrideOutput>;
}
