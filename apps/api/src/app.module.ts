import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './modules/security/infra/http/guards/jwt-auth.guard';
import { RbacGuard } from './modules/security/infra/http/guards/rbac.guard';
import { SensitiveMaskingInterceptor } from './modules/security/infra/http/interceptors/sensitive-masking.interceptor';
import { SecurityModule } from './modules/security/security.module';
import { SharedModule } from './shared/infra/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    SharedModule,
    SecurityModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: SensitiveMaskingInterceptor },
  ],
})
export class AppModule {}