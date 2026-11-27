export interface AuditEntryInput {
  userId?: string;
  ipAddress?: string;
  terminalId?: string;
  module: string;
  action:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'SESSION_LOCKED_INACTIVITY'
    | 'CREATE'
    | 'UPDATE'
    | 'VOID'
    | 'SUPERVISOR_OVERRIDE'
    | 'FISCAL_SEQUENCE_ALERT'
    | 'CART_ITEM_REMOVED'
    | 'DRAWER_MANUAL_OPEN';
  documentType?: string;
  documentId?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
}

export interface AuditPort {
  record(entry: AuditEntryInput, tx?: unknown): Promise<void>;
}

export const AUDIT_PORT = Symbol('AUDIT_PORT');