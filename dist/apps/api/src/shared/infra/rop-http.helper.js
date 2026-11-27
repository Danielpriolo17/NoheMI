"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapOrThrowHttp = unwrapOrThrowHttp;
const common_1 = require("@nestjs/common");
function unwrapOrThrowHttp(result) {
    if (result.isOk)
        return result.value;
    throw new common_1.HttpException({
        code: result.error.code,
        message: result.error.message,
        metadata: result.error.metadata ?? null,
    }, result.error.httpStatus);
}
//# sourceMappingURL=rop-http.helper.js.map