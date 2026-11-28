import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { unwrapOrThrowHttp } from '../../../../shared/infra/http-result';
import { LoginUseCase } from '../../application/login.use-case';
import { SupervisorOverrideUseCase } from '../../application/supervisor-override.use-case';
import { AuthenticatedUser } from '../../domain/auth.types';
import {
  SESSION_STORE_PORT,
  SessionStorePort,
} from '../../domain/security.ports';
import { CurrentUser, Public } from './decorators/security.decorators';
import { LoginDto, RequestSupervisorOverrideDto } from './dto/auth.dto';

@ApiTags('Módulo 1 — Seguridad y Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly overrideUseCase: SupervisorOverrideUseCase,
    @Inject(SESSION_STORE_PORT)
    private readonly sessionStore: SessionStorePort,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Inicio de sesión con Argon2id y sesión deslizante en Redis' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.loginUseCase.execute({
      username: dto.username,
      password: dto.password,
      terminalId: dto.terminalId,
      ipAddress: req.ip,
    });
    return unwrapOrThrowHttp(result);
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Cierre de sesión inmediato (revoca clave Redis)' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.sessionStore.revokeSession(user.sessionId);
    return { message: 'Sesión cerrada correctamente.' };
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Perfil activo y permisos granulares del usuario autenticado' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @ApiBearerAuth()
  @Post('supervisor-override')
  @ApiOperation({
    summary: 'Autorización emergente por PIN de supervisor en caliente (RF-01)',
  })
  async requestOverride(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestSupervisorOverrideDto,
    @Req() req: Request,
  ) {
    const result = await this.overrideUseCase.authorize({
      requester: user,
      supervisorUsername: dto.supervisorUsername,
      supervisorPin: dto.supervisorPin,
      actionCode: dto.actionCode,
      reason: dto.reason,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      ipAddress: req.ip,
    });
    return unwrapOrThrowHttp(result);
  }
}