"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainError = void 0;
const domainError = (code, message, httpStatus = 422, metadata) => ({ code, message, httpStatus, metadata });
exports.domainError = domainError;
//# sourceMappingURL=domain-error.js.map