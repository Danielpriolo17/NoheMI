-- 1. CB-02: Prohibición absoluta de stock negativo a nivel de motor BD
ALTER TABLE "StockBalance"
  ADD CONSTRAINT chk_stock_non_negative
  CHECK ("availableQty" >= 0 AND "physicalQty" >= 0 AND "custodyQty" >= 0 AND "reservedQty" >= 0);

-- 2. RNF-01: Índice GIN trigram para búsqueda <300ms en >50.000 SKUs por nombre/SKU/ref
CREATE INDEX idx_product_search_trgm
  ON "Product" USING GIN (
    (sku || ' ' || name || ' ' || COALESCE("manufacturerRef", '') || ' ' || COALESCE(brand, ''))
    gin_trgm_ops
  );

-- 3. RF-09 y RF-30: Blindaje Append-Only (prohibir UPDATE y DELETE en AuditLog y KardexMovement)
CREATE OR REPLACE FUNCTION prevent_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Operación % prohibida: la tabla % es estrictamente inmutable (append-only).', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trg_kardex_immutable
  BEFORE UPDATE OR DELETE ON "KardexMovement"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();