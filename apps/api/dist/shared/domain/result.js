"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineResults = exports.err = exports.ok = exports.Err = exports.Ok = void 0;
class Ok {
    value;
    isOk = true;
    isErr = false;
    constructor(value) {
        this.value = value;
    }
    map(fn) {
        return (0, exports.ok)(fn(this.value));
    }
    flatMap(fn) {
        return fn(this.value);
    }
    async flatMapAsync(fn) {
        return fn(this.value);
    }
    match(handlers) {
        return handlers.ok(this.value);
    }
}
exports.Ok = Ok;
class Err {
    error;
    isOk = false;
    isErr = true;
    constructor(error) {
        this.error = error;
    }
    map(_fn) {
        return (0, exports.err)(this.error);
    }
    flatMap(_fn) {
        return (0, exports.err)(this.error);
    }
    async flatMapAsync(_fn) {
        return (0, exports.err)(this.error);
    }
    match(handlers) {
        return handlers.err(this.error);
    }
}
exports.Err = Err;
const ok = (value) => new Ok(value);
exports.ok = ok;
const err = (error) => new Err(error);
exports.err = err;
const combineResults = (results) => {
    const values = [];
    for (const r of results) {
        if (r.isErr)
            return (0, exports.err)(r.error);
        values.push(r.value);
    }
    return (0, exports.ok)(values);
};
exports.combineResults = combineResults;
//# sourceMappingURL=result.js.map