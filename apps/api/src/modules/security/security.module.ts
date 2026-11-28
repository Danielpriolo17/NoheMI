import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './application/login.use-case';
import { SupervisorOverrideUseCase } from './application/supervisor-override.use-case';
import {
  PASSWORD_HASHER_PORT,
  SECURITY_REPO_PORT,
  SESSION_STORE_PORT,
} from './domain/security.ports';
import { Argon2HasherAdapter } from './infra/argon2-hasher.adapter';
import { AuthController } from './infra/http/auth.controller';
import { JwtAuthGuard } from './infra/http/guards/jwt-auth.guard';
import { RbacGuard } from './infra/http/guards/rbac.guard';
import { SensitiveMaskingInterceptor } from './infra/http/interceptors/sensitive-masking.interceptor';
import { PrismaSecurityRepository } from './infra/prisma-security.repository';
import { RedisSessionStore } from './infra/redis-session.store';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // El JWT dura 8h (turno); el bloqueo por inactividad de 3-5 min lo controla Redis
          expiresIn: 28800,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    SupervisorOverrideUseCase,
    JwtAuthGuard,
    RbacGuard,
    SensitiveMaskingInterceptor,
    { provide: SECURITY_REPO_PORT, useClass: PrismaSecurityRepository },
    { provide: SESSION_STORE_PORT, useClass: RedisSessionStore },
    { provide: PASSWORD_HASHER_PORT, useClass: Argon2HasherAdapter },
  ],
  exports: [
    JwtModule,
    SupervisorOverrideUseCase,
    SECURITY_REPO_PORT,
    SESSION_STORE_PORT,
    PASSWORD_HASHER_PORT,
  ],
})
export class SecurityModule {}