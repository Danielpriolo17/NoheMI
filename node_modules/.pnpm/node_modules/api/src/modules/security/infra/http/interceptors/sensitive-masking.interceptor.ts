import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticatedRequest } from '../decorators/security.decorators';

const COST_SENSITIVE_FIELDS = new Set<string>([
  'averageCost',
  'unitCost',
  'unitCostSnapshot',
  'totalCost',
  'landedUnitCost',
  'purchasePrice',
  'realMargin',
  'marginPercent',
  'grossProfit',
]);

const CASH_THEORETICAL_FIELDS = new Set<string>([
  'expectedCash',
  'expectedCards',
  'expectedTransfers',
  'expectedChecks',
  'cashDifference',
  'frozenSystemQty', // Oculta teórico en toma física ciega
  'orderedQty',      // Oculta pedido en recepción ciega
  'expectedQtyInBase',
]);

@Injectable()
export class SensitiveMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return next.handle().pipe(
      map((data: unknown) => {
        if (!user) return data;

        const blocked = new Set<string>();
        if (!user.canViewCosts) {
          COST_SENSITIVE_FIELDS.forEach((f) => blocked.add(f));
        }
        if (!user.canViewCashExpected) {
          CASH_THEORETICAL_FIELDS.forEach((f) => blocked.add(f));
        }

        if (blocked.size === 0) return data;
        return this.sanitize(data, blocked);
      }),
    );
  }

  private sanitize(value: unknown, blocked: Set<string>): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;
    if (value instanceof Date) return value;

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item, blocked));
    }

    const inputObj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(inputObj)) {
      if (blocked.has(key)) continue;
      sanitized[key] = this.sanitize(val, blocked);
    }

    return sanitized;
  }
}