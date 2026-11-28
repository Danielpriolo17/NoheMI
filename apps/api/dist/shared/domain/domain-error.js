"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainError = void 0;
const domainError = (code, message, httpStatus = 422, details) => ({
    code,
    message,
    httpStatus,
    details,
});
exports.domainError = domainError;
//# sourceMappingURL=domain-error.js.map