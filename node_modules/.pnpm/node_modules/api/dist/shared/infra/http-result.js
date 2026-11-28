"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapOrThrowHttp = unwrapOrThrowHttp;
const common_1 = require("@nestjs/common");
function unwrapOrThrowHttp(result) {
    return result.match({
        ok: (value) => value,
        err: (error) => {
            throw new common_1.HttpException({
                code: error.code,
                message: error.message,
                details: error.details ?? null,
            }, error.httpStatus);
        },
    });
}
//# sourceMappingURL=http-result.js.map