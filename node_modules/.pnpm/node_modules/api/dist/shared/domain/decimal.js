"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decimal = exports.Qty = void 0;
const decimal_js_1 = require("decimal.js");
Object.defineProperty(exports, "Decimal", { enumerable: true, get: function () { return decimal_js_1.Decimal; } });
decimal_js_1.Decimal.set({
    precision: 24,
    rounding: decimal_js_1.Decimal.ROUND_HALF_UP,
});
class Qty {
    value;
    constructor(val) {
        this.value = new decimal_js_1.Decimal(val);
    }
    static of(val) {
        return new Qty(val);
    }
    static zero() {
        return new Qty(0);
    }
    add(other) {
        return new Qty(this.value.plus(other.value));
    }
    sub(other) {
        return new Qty(this.value.minus(other.value));
    }
    mul(factor) {
        return new Qty(this.value.times(factor));
    }
    div(divisor) {
        return new Qty(this.value.dividedBy(divisor));
    }
    gte(other) {
        return this.value.gte(other.value);
    }
    gt(other) {
        return this.value.gt(other.value);
    }
    lt(other) {
        return this.value.lt(other.value);
    }
    isNegative() {
        return this.value.isNegative();
    }
    toFixed4() {
        return this.value.toFixed(4);
    }
    toFixed2() {
        return this.value.toFixed(2);
    }
}
exports.Qty = Qty;
//# sourceMappingURL=decimal.js.map