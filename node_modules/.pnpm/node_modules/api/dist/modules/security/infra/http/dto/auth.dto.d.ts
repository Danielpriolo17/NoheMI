import { OverrideActionCode } from '../../../domain/auth.types';
export declare class LoginDto {
    username: string;
    password: string;
    terminalId?: string;
}
export declare class RequestSupervisorOverrideDto {
    supervisorUsername: string;
    supervisorPin: string;
    actionCode: OverrideActionCode;
    reason: string;
    referenceType: string;
    referenceId: string;
}
