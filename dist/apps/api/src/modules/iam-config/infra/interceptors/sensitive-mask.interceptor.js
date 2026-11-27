"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensitiveMaskInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const PRIVILEGED_COST_ROLES = new Set([
    'ADMIN_GERENCIA',
    'CONTADOR_TESORERIA',
]);
const SENSITIVE_FIELDS = new Set([
    'avgCost',
    'lastPurchaseCost',
    'unitCost',
    'unitCostSnapshot',
    'totalCost',
    'marginPct',
    'minMarginPct',
    'theoreticalTotal',
    'varianceAmount',
    'orderedQty',
    'frozenSystemQty',
]);
let SensitiveMaskInterceptor = class SensitiveMaskInterceptor {
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const shouldMask = !user || !PRIVILEGED_COST_ROLES.has(user.role);
        if (!shouldMask)
            return next.handle();
        return next.handle().pipe((0, rxjs_1.map)((data) => this.stripSensitive(data)));
    }
    stripSensitive(node) {
        if (Array.isArray(node)) {
            return node.map((item) => this.stripSensitive(item));
        }
        if (node !== null && typeof node === 'object' && !(node instanceof Date)) {
            const cleaned = {};
            for (const [key, value] of Object.entries(node)) {
                if (SENSITIVE_FIELDS.has(key))
                    continue;
                cleaned[key] = this.stripSensitive(value);
            }
            return cleaned;
        }
        return node;
    }
};
exports.SensitiveMaskInterceptor = SensitiveMaskInterceptor;
exports.SensitiveMaskInterceptor = SensitiveMaskInterceptor = __decorate([
    (0, common_1.Injectable)()
], SensitiveMaskInterceptor);
//# sourceMappingURL=sensitive-mask.interceptor.js.map