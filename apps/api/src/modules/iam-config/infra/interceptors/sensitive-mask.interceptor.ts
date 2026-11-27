import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AuthenticatedUser } from '../guards/session-activity.guard';

const PRIVILEGED_COST_ROLES = new Set<string>([
  'ADMIN_GERENCIA',
  'CONTADOR_TESORERIA',
]);

// Campos estrictamente ocultos para Cajero, Vendedor, Bodeguero y Despachador
const SENSITIVE_FIELDS = new Set<string>([
  'avgCost',
  'lastPurchaseCost',
  'unitCost',
  'unitCostSnapshot',
  'totalCost',
  'marginPct',
  'minMarginPct',
  'theoreticalTotal', // Arqueo ciego (RF-20, CB-07)
  'varianceAmount',   // Arqueo ciego
  'orderedQty',       // Recepción ciega contra OC (RF-08, CB-07)
  'frozenSystemQty',  // Conteo cíclico ciego (RF-11)
]);

@Injectable()
export class SensitiveMaskInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = req.user;
    const shouldMask = !user || !PRIVILEGED_COST_ROLES.has(user.role);

    if (!shouldMask) return next.handle();

    return next.handle().pipe(map((data) => this.stripSensitive(data)));
  }

  private stripSensitive(node: unknown): unknown {
    if (Array.isArray(node)) {
      return node.map((item) => this.stripSensitive(item));
    }
    if (node !== null && typeof node === 'object' && !(node instanceof Date)) {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        if (SENSITIVE_FIELDS.has(key)) continue;
        cleaned[key] = this.stripSensitive(value);
      }
      return cleaned;
    }
    return node;
  }
}