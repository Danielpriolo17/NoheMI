import { AuthenticatedUser } from './guards/session-activity.guard';
import { AuthorizeSupervisorPinInput, AuthorizeSupervisorPinUseCase } from '../application/authorize-supervisor-pin.usecase';
export declare class IamConfigController {
    private readonly authorizeSupervisorPin;
    constructor(authorizeSupervisorPin: AuthorizeSupervisorPinUseCase);
    requestSupervisorOverride(req: {
        user: AuthenticatedUser;
    }, ipAddress: string, body: Omit<AuthorizeSupervisorPinInput, 'requesterId' | 'ipAddress' | 'terminalId'>): Promise<import("../application/authorize-supervisor-pin.usecase").SupervisorOverrideGrant>;
}
