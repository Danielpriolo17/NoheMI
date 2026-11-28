"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensitiveMaskingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const COST_SENSITIVE_FIELDS = new Set([
    'averageCost',
    'unitCost',
    'unitCostSnapshot',
    'totalCost',
    'landedUnitCost',
    'purchasePrice',
    'realMargin',
    'marginPercent',
    'grossProfit',
]);
const CASH_THEORETICAL_FIELDS = new Set([
    'expectedCash',
    'expectedCards',
    'expectedTransfers',
    'expectedChecks',
    'cashDifference',
    'frozenSystemQty',
    'orderedQty',
    'expectedQtyInBase',
]);
let SensitiveMaskingInterceptor = class SensitiveMaskingInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return next.handle().pipe((0, operators_1.map)((data) => {
            if (!user)
                return data;
            const blocked = new Set();
            if (!user.canViewCosts) {
                COST_SENSITIVE_FIELDS.forEach((f) => blocked.add(f));
            }
            if (!user.canViewCashExpected) {
                CASH_THEORETICAL_FIELDS.forEach((f) => blocked.add(f));
            }
            if (blocked.size === 0)
                return data;
            return this.sanitize(data, blocked);
        }));
    }
    sanitize(value, blocked) {
        if (value === null || value === undefined)
            return value;
        if (typeof value !== 'object')
            return value;
        if (value instanceof Date)
            return value;
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitize(item, blocked));
        }
        const inputObj = value;
        const sanitized = {};
        for (const [key, val] of Object.entries(inputObj)) {
            if (blocked.has(key))
                continue;
            sanitized[key] = this.sanitize(val, blocked);
        }
        return sanitized;
    }
};
exports.SensitiveMaskingInterceptor = SensitiveMaskingInterceptor;
exports.SensitiveMaskingInterceptor = SensitiveMaskingInterceptor = __decorate([
    (0, common_1.Injectable)()
], SensitiveMaskingInterceptor);
//# sourceMappingURL=sensitive-masking.interceptor.js.map