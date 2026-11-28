import { Decimal } from 'decimal.js';
export declare class Qty {
    readonly value: Decimal;
    private constructor();
    static of(val: Decimal.Value): Qty;
    static zero(): Qty;
    add(other: Qty): Qty;
    sub(other: Qty): Qty;
    mul(factor: Decimal.Value): Qty;
    div(divisor: Decimal.Value): Qty;
    gte(other: Qty): boolean;
    gt(other: Qty): boolean;
    lt(other: Qty): boolean;
    isNegative(): boolean;
    toFixed4(): string;
    toFixed2(): string;
}
export { Decimal };
