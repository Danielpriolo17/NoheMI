"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamConfigController = void 0;
const common_1 = require("@nestjs/common");
const session_activity_guard_1 = require("./guards/session-activity.guard");
const rbac_guard_1 = require("./guards/rbac.guard");
const sensitive_mask_interceptor_1 = require("./interceptors/sensitive-mask.interceptor");
const require_permission_decorator_1 = require("./decorators/require-permission.decorator");
const authorize_supervisor_pin_usecase_1 = require("../application/authorize-supervisor-pin.usecase");
const rop_http_helper_1 = require("../../../shared/infra/rop-http.helper");
const PostRoute = (path) => {
    const decorator = (0, common_1.Post)(path);
    return (method, context) => {
        decorator({}, context.name, { value: method });
    };
};
let IamConfigController = class IamConfigController {
    constructor(authorizeSupervisorPin) {
        this.authorizeSupervisorPin = authorizeSupervisorPin;
    }
    async requestSupervisorOverride(req, ipAddress, body) {
        const result = await this.authorizeSupervisorPin.execute({
            ...body,
            requesterId: req.user.sub,
            terminalId: req.user.terminalId,
            ipAddress,
        });
        return (0, rop_http_helper_1.unwrapOrThrowHttp)(result);
    }
};
exports.IamConfigController = IamConfigController;
__decorate([
    PostRoute('supervisor-override'),
    (0, require_permission_decorator_1.RequirePermission)('pos_billing', 'C'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], IamConfigController.prototype, "requestSupervisorOverride", null);
exports.IamConfigController = IamConfigController = __decorate([
    (0, common_1.Controller)('api/v1/iam'),
    (0, common_1.UseGuards)(session_activity_guard_1.SessionActivityGuard, rbac_guard_1.RbacGuard),
    (0, common_1.UseInterceptors)(sensitive_mask_interceptor_1.SensitiveMaskInterceptor),
    __metadata("design:paramtypes", [authorize_supervisor_pin_usecase_1.AuthorizeSupervisorPinUseCase])
], IamConfigController);
//# sourceMappingURL=iam-config.controller.js.map