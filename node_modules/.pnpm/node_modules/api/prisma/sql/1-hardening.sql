-- 1. Rendimiento de búsqueda < 300ms sobre >50.000 SKUs (RNF-01)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
  ON products USING gin (sku gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_mfr_ref_trgm
  ON products USING gin (manufacturer_ref gin_trgm_ops);

-- 2. Prohibición técnica de inventario negativo e integridad tridimensional (CB-02)
ALTER TABLE inventory_balances
  DROP CONSTRAINT IF EXISTS chk_inventory_non_negative,
  DROP CONSTRAINT IF EXISTS chk_inventory_3d_equation;

ALTER TABLE inventory_balances
  ADD CONSTRAINT chk_inventory_non_negative
    CHECK (physical_qty >= 0 AND available_qty >= 0 AND custody_qty >= 0 AND in_transit_qty >= 0),
  ADD CONSTRAINT chk_inventory_3d_equation
    CHECK (physical_qty = available_qty + custody_qty);

-- 3. Protección Append-Only para Bitácora de Auditoría y Kardex (RF-30, RF-09)
CREATE OR REPLACE FUNCTION prevent_immutable_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operación prohibida: la tabla % es inmutable (append-only).', TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_immutable_modification();

DROP TRIGGER IF EXISTS trg_kardex_immutable ON kardex_movements;
CREATE TRIGGER trg_kardex_immutable
  BEFORE UPDATE OR DELETE ON kardex_movements
  FOR EACH ROW EXECUTE FUNCTION prevent_immutable_modification();

-- 4. Prohibición de borrado físico de facturas (CB-03)
CREATE OR REPLACE FUNCTION prevent_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operación prohibida (CB-03): las facturas no pueden eliminarse físicamente. Use Nota Crédito o anulación controlada.'
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoices_no_delete ON invoices;
CREATE TRIGGER trg_invoices_no_delete
  BEFORE DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION prevent_invoice_delete();