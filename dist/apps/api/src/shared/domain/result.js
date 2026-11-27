"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.err = exports.ok = exports.Err = exports.Ok = void 0;
class Ok {
    constructor(value) {
        this.value = value;
        this.isOk = true;
        this.isErr = false;
    }
    map(fn) {
        return (0, exports.ok)(fn(this.value));
    }
    andThen(fn) {
        return fn(this.value);
    }
}
exports.Ok = Ok;
class Err {
    constructor(error) {
        this.error = error;
        this.isOk = false;
        this.isErr = true;
    }
    map(_fn) {
        return (0, exports.err)(this.error);
    }
    andThen(_fn) {
        return (0, exports.err)(this.error);
    }
}
exports.Err = Err;
const ok = (value) => new Ok(value);
exports.ok = ok;
const err = (error) => new Err(error);
exports.err = err;
//# sourceMappingURL=result.js.map