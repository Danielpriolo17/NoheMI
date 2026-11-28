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
exports.RequestSupervisorOverrideDto = exports.LoginDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const OVERRIDE_ACTIONS = [
    'EXTRAORDINARY_DISCOUNT',
    'VOID_PRE_TRANSMISSION_INVOICE',
    'UNLOCK_OVERDUE_CREDIT',
    'MANUAL_CASH_DRAWER_OPEN',
    'APPROVE_RETURN_REFUND',
];
class LoginDto {
    username;
    password;
    terminalId;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NohemiAdmin2026*' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'UUID de la terminal POS si aplica' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LoginDto.prototype, "terminalId", void 0);
class RequestSupervisorOverrideDto {
    supervisorUsername;
    supervisorPin;
    actionCode;
    reason;
    referenceType;
    referenceId;
}
exports.RequestSupervisorOverrideDto = RequestSupervisorOverrideDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestSupervisorOverrideDto.prototype, "supervisorUsername", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '987654' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], RequestSupervisorOverrideDto.prototype, "supervisorPin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: OVERRIDE_ACTIONS }),
    (0, class_validator_1.IsIn)(OVERRIDE_ACTIONS),
    __metadata("design:type", String)
], RequestSupervisorOverrideDto.prototype, "actionCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Descuento especial cliente constructor frecuente' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], RequestSupervisorOverrideDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Invoice' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestSupervisorOverrideDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'temp-cart-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestSupervisorOverrideDto.prototype, "referenceId", void 0);
//# sourceMappingURL=auth.dto.js.map