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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../../../shared/infra/prisma.service");
const require_permission_decorator_1 = require("../decorators/require-permission.decorator");
let RbacGuard = class RbacGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const required = this.reflector.getAllAndOverride(require_permission_decorator_1.PERMISSION_METADATA_KEY, [context.getHandler(), context.getClass()]);
        if (!required)
            return true;
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user)
            return false;
        const permission = await this.prisma.rolePermission.findUnique({
            where: {
                role_resource_action: {
                    role: user.role,
                    resource: required.resource,
                    action: required.action,
                },
            },
        });
        if (!permission) {
            throw new common_1.ForbiddenException({
                code: 'FORBIDDEN_RBAC',
                message: `El rol ${user.role} no tiene permiso [${required.action}] sobre [${required.resource}].`,
            });
        }
        req.rbacContext = {
            isRestricted: permission.isRestricted,
            hideCostData: permission.hideCostData,
        };
        return true;
    }
};
exports.RbacGuard = RbacGuard;
exports.RbacGuard = RbacGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, prisma_service_1.PrismaService])
], RbacGuard);
//# sourceMappingURL=rbac.guard.js.map