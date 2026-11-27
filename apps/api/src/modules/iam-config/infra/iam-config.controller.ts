import { Body, Controller, Ip, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  AuthenticatedUser,
  SessionActivityGuard,
} from './guards/session-activity.guard';
import { RbacGuard } from './guards/rbac.guard';
import { SensitiveMaskInterceptor } from './interceptors/sensitive-mask.interceptor';
import { RequirePermission } from './decorators/require-permission.decorator';
import {
  AuthorizeSupervisorPinInput,
  AuthorizeSupervisorPinUseCase,
} from '../application/authorize-supervisor-pin.usecase';
import { unwrapOrThrowHttp } from '../../../shared/infra/rop-http.helper';

const PostRoute = (path: string) => {
  const decorator = Post(path);
  return (method: Function, context: ClassMethodDecoratorContext) => {
    decorator({}, context.name, { value: method });
  };
};

@Controller('api/v1/iam')
@UseGuards(SessionActivityGuard, RbacGuard)
@UseInterceptors(SensitiveMaskInterceptor)
export class IamConfigController {
  constructor(
    private readonly authorizeSupervisorPin: AuthorizeSupervisorPinUseCase,
  ) {}

  @PostRoute('supervisor-override')
  @RequirePermission('pos_billing', 'C')
  async requestSupervisorOverride(
    @Req() req: { user: AuthenticatedUser },
    @Ip() ipAddress: string,
    @Body()
    body: Omit<AuthorizeSupervisorPinInput, 'requesterId' | 'ipAddress' | 'terminalId'>,
  ) {
    const result = await this.authorizeSupervisorPin.execute({
      ...body,
      requesterId: req.user.sub,
      terminalId: req.user.terminalId,
      ipAddress,
    });
    return unwrapOrThrowHttp(result);
  }
}