import { Decimal } from 'decimal.js';

Decimal.set({
  precision: 24,
  rounding: Decimal.ROUND_HALF_UP,
});

export class Qty {
  public readonly value: Decimal;

  private constructor(val: Decimal.Value) {
    this.value = new Decimal(val);
  }

  static of(val: Decimal.Value): Qty {
    return new Qty(val);
  }

  static zero(): Qty {
    return new Qty(0);
  }

  add(other: Qty): Qty {
    return new Qty(this.value.plus(other.value));
  }

  sub(other: Qty): Qty {
    return new Qty(this.value.minus(other.value));
  }

  mul(factor: Decimal.Value): Qty {
    return new Qty(this.value.times(factor));
  }

  div(divisor: Decimal.Value): Qty {
    return new Qty(this.value.dividedBy(divisor));
  }

  gte(other: Qty): boolean {
    return this.value.gte(other.value);
  }

  gt(other: Qty): boolean {
    return this.value.gt(other.value);
  }

  lt(other: Qty): boolean {
    return this.value.lt(other.value);
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  toFixed4(): string {
    return this.value.toFixed(4);
  }

  toFixed2(): string {
    return this.value.toFixed(2);
  }
}

export { Decimal };