"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.RequirePermission = exports.Public = exports.REQUIRED_PERMISSION_KEY = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'nohemi:is_public';
exports.REQUIRED_PERMISSION_KEY = 'nohemi:required_permission';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
const RequirePermission = (resource, action) => (0, common_1.SetMetadata)(exports.REQUIRED_PERMISSION_KEY, {
    resource,
    action,
});
exports.RequirePermission = RequirePermission;
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
        throw new Error('CurrentUser decorator used on unauthenticated route.');
    }
    return request.user;
});
//# sourceMappingURL=security.decorators.js.map