-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('ADMIN_GERENCIA', 'CONTADOR_TESORERIA', 'CAJERO', 'VENDEDOR_MOSTRADOR', 'BODEGUERO', 'DESPACHADOR_LOGISTICA');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('MOSTRADOR', 'ALMACEN_CERRADO', 'PATIO_GRANELES', 'CUARENTENA_AVERIAS', 'CUSTODIA_VIRTUAL', 'EN_TRANSITO_VIRTUAL');

-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('FACTURA_ELECTRONICA', 'TIRILLA_POS', 'FACTURA_CONTINGENCIA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'REMISION', 'RECIBO_CAJA', 'ORDEN_COMPRA', 'VALE_CUSTODIA', 'TRASLADO');

-- CreateEnum
CREATE TYPE "KardexMovementType" AS ENUM ('COMPRA_RECEPCION', 'VENTA_POS', 'VENTA_CUSTODIA_RESERVA', 'ENTREGA_CUSTODIA', 'CANCELACION_CUSTODIA', 'DEVOLUCION_VENTA_VENDIBLE', 'DEVOLUCION_VENTA_AVERIA', 'DEVOLUCION_PROVEEDOR', 'TRASLADO_SALIDA', 'TRASLADO_ENTRADA', 'FRACCIONAMIENTO_SALIDA', 'FRACCIONAMIENTO_ENTRADA', 'MERMA_CORTE', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'KIT_EXPLOSION_SALIDA');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('BORRADOR', 'APROBADA', 'PARCIALMENTE_RECIBIDA', 'RECIBIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('BORRADOR', 'CON_DISCREPANCIA', 'APROBADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('EN_TRANSITO', 'RECIBIDO_COMPLETO', 'RECIBIDO_CON_FALTANTE', 'ANULADO');

-- CreateEnum
CREATE TYPE "CycleCountStatus" AS ENUM ('ABIERTO', 'RECONTEO_REQUERIDO', 'PENDIENTE_APROBACION', 'CERRADO');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('MOSTRADOR', 'MAYORISTA', 'CONTRATISTA', 'CONVENIO');

-- CreateEnum
CREATE TYPE "InvoiceDeliveryMode" AS ENUM ('RETIRO_INMEDIATO', 'DESPACHO_DOMICILIO', 'ENTREGA_PARCIAL_CUSTODIA');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('EMITIDA_LOCAL', 'TRANSMITIDA_DIAN', 'CONTINGENCIA_PENDIENTE', 'ANULADA_PRE_TRANSMISION', 'CON_NOTA_CREDITO_PARCIAL', 'CON_NOTA_CREDITO_TOTAL');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDIENTE_ALISTAMIENTO', 'EN_ALISTAMIENTO', 'CARGADO', 'EN_RUTA', 'ENTREGADO', 'ENTREGA_PARCIAL', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'CHEQUE', 'CREDITO_INTERNO', 'SALDO_A_FAVOR');

-- CreateEnum
CREATE TYPE "CashShiftStatus" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "CommissionBasis" AS ENUM ('VENTA_FACTURADA', 'VENTA_RECAUDADA');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PRE_NOMINA', 'CERRADA');

-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('MEDIA', 'ALTA', 'CRITICA');

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "address" VARCHAR(250) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "code" VARCHAR(25) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "WarehouseType" NOT NULL,
    "allowsDirectSales" BOOLEAN NOT NULL DEFAULT false,
    "allowsDispatch" BOOLEAN NOT NULL DEFAULT true,
    "allowsReceiving" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "zone" VARCHAR(20) NOT NULL,
    "aisle" VARCHAR(20) NOT NULL,
    "rack" VARCHAR(20) NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "barcode" VARCHAR(60) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "canViewCosts" BOOLEAN NOT NULL DEFAULT false,
    "canViewCashExpected" BOOLEAN NOT NULL DEFAULT false,
    "canApproveOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "resource" VARCHAR(60) NOT NULL,
    "action" VARCHAR(10) NOT NULL,
    "description" VARCHAR(200) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "ownRecordsOnly" BOOLEAN NOT NULL DEFAULT false,
    "maskedSensitive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "fullName" VARCHAR(140) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "supervisorPinHash" VARCHAR(255),
    "allowedWorkStart" VARCHAR(5),
    "allowedWorkEnd" VARCHAR(5),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_override_logs" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "approverId" UUID NOT NULL,
    "actionCode" VARCHAR(60) NOT NULL,
    "reason" VARCHAR(250) NOT NULL,
    "referenceType" VARCHAR(60) NOT NULL,
    "referenceId" VARCHAR(80) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervisor_override_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rules" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "taxType" VARCHAR(30) NOT NULL,
    "ratePercent" DECIMAL(7,4) NOT NULL,
    "minBaseAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "isRetention" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_resolutions" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "documentType" "FiscalDocumentType" NOT NULL,
    "resolutionNumber" VARCHAR(60) NOT NULL,
    "prefix" VARCHAR(15) NOT NULL,
    "rangeStart" BIGINT NOT NULL,
    "rangeEnd" BIGINT NOT NULL,
    "currentNumber" BIGINT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isContingency" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_terminals" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "defaultWarehouseId" UUID NOT NULL,
    "primaryResolutionId" UUID,
    "contingencyResolutionId" UUID,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "maxCashAllowed" DECIMAL(18,4) NOT NULL,
    "thermalPrinterConfig" JSONB,
    "laserPrinterConfig" JSONB,
    "scaleSerialConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_drawer_events" (
    "id" UUID NOT NULL,
    "terminalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "shiftId" UUID,
    "reason" VARCHAR(120) NOT NULL,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_drawer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_periods" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedBy" UUID,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parentId" UUID,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "maxShrinkagePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "minMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "id" UUID NOT NULL,
    "code" VARCHAR(15) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "allowDecimals" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(40) NOT NULL,
    "manufacturerRef" VARCHAR(60),
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "categoryId" UUID NOT NULL,
    "brandId" UUID,
    "baseUomId" UUID NOT NULL,
    "taxRuleId" UUID NOT NULL,
    "specs" JSONB,
    "weightKg" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "volumeM3" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "baseSalePrice" DECIMAL(18,4) NOT NULL,
    "minMarginPercent" DECIMAL(5,2),
    "isKit" BOOLEAN NOT NULL DEFAULT false,
    "requiresSerial" BOOLEAN NOT NULL DEFAULT false,
    "isCuttable" BOOLEAN NOT NULL DEFAULT false,
    "isWeighable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_barcodes" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "unitConversionId" UUID,
    "barcode" VARCHAR(80) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_unit_conversions" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "uomId" UUID NOT NULL,
    "factorToBase" DECIMAL(18,6) NOT NULL,
    "isPurchaseUnit" BOOLEAN NOT NULL DEFAULT false,
    "isSaleUnit" BOOLEAN NOT NULL DEFAULT true,
    "overridePrice" DECIMAL(18,4),

    CONSTRAINT "product_unit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_warehouse_locations" (
    "productId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_warehouse_locations_pkey" PRIMARY KEY ("productId","locationId")
);

-- CreateTable
CREATE TABLE "product_kit_items" (
    "id" UUID NOT NULL,
    "kitProductId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "quantityInBase" DECIMAL(18,4) NOT NULL,
    "priceWeightRatio" DECIMAL(7,6) NOT NULL,

    CONSTRAINT "product_kit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_relations" (
    "sourceProductId" UUID NOT NULL,
    "targetProductId" UUID NOT NULL,
    "relationType" VARCHAR(20) NOT NULL,

    CONSTRAINT "product_relations_pkey" PRIMARY KEY ("sourceProductId","targetProductId","relationType")
);

-- CreateTable
CREATE TABLE "inventory_balances" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "physicalQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "availableQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "custodyQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "inTransitQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "maxStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "salesBlocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_serials" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "warehouseId" UUID,
    "serialNumber" VARCHAR(100) NOT NULL,
    "status" VARCHAR(25) NOT NULL,
    "goodsReceiptId" UUID,
    "invoiceId" UUID,
    "warrantyUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_serials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kardex_movements" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "movementType" "KardexMovementType" NOT NULL,
    "quantityDelta" DECIMAL(18,4) NOT NULL,
    "previousQty" DECIMAL(18,4) NOT NULL,
    "newQty" DECIMAL(18,4) NOT NULL,
    "unitCost" DECIMAL(18,4) NOT NULL,
    "totalCost" DECIMAL(18,4) NOT NULL,
    "documentType" VARCHAR(40) NOT NULL,
    "documentId" UUID NOT NULL,
    "documentNumber" VARCHAR(60) NOT NULL,
    "userId" UUID NOT NULL,
    "notes" VARCHAR(250),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kardex_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "taxId" VARCHAR(30) NOT NULL,
    "businessName" VARCHAR(160) NOT NULL,
    "contactName" VARCHAR(120),
    "email" VARCHAR(120),
    "phone" VARCHAR(40),
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 5,
    "earlyPayDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(40) NOT NULL,
    "supplierId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'BORRADOR',
    "expectedAt" TIMESTAMP(3),
    "subtotal" DECIMAL(18,4) NOT NULL,
    "taxTotal" DECIMAL(18,4) NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "createdBy" UUID NOT NULL,
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "uomCode" VARCHAR(15) NOT NULL,
    "factorToBase" DECIMAL(18,6) NOT NULL,
    "orderedQty" DECIMAL(18,4) NOT NULL,
    "receivedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL,
    "receiptNumber" VARCHAR(40) NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "supplierInvoiceNum" VARCHAR(60) NOT NULL,
    "freightCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "insuranceCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'BORRADOR',
    "hasDiscrepancies" BOOLEAN NOT NULL DEFAULT false,
    "receivedBy" UUID NOT NULL,
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" UUID NOT NULL,
    "goodsReceiptId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "countedQtyInBase" DECIMAL(18,4) NOT NULL,
    "damagedQtyInBase" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "expectedQtyInBase" DECIMAL(18,4) NOT NULL,
    "landedUnitCost" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" UUID NOT NULL,
    "transferNumber" VARCHAR(40) NOT NULL,
    "originWarehouseId" UUID NOT NULL,
    "destWarehouseId" UUID NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'EN_TRANSITO',
    "driverName" VARCHAR(120),
    "vehiclePlate" VARCHAR(20),
    "dispatchedBy" UUID NOT NULL,
    "receivedBy" UUID,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_items" (
    "id" UUID NOT NULL,
    "transferId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sentQty" DECIMAL(18,4) NOT NULL,
    "receivedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_counts" (
    "id" UUID NOT NULL,
    "countNumber" VARCHAR(40) NOT NULL,
    "warehouseId" UUID NOT NULL,
    "scope" VARCHAR(120) NOT NULL,
    "status" "CycleCountStatus" NOT NULL DEFAULT 'ABIERTO',
    "createdBy" UUID NOT NULL,
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "cycle_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_count_items" (
    "id" UUID NOT NULL,
    "cycleCountId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "frozenSystemQty" DECIMAL(18,4) NOT NULL,
    "firstCountQty" DECIMAL(18,4),
    "secondCountQty" DECIMAL(18,4),
    "adjustmentReason" VARCHAR(60),

    CONSTRAINT "cycle_count_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_lists" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "segment" "CustomerSegment" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_items" (
    "id" UUID NOT NULL,
    "priceListId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "minQuantity" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "maxDiscountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "taxId" VARCHAR(30) NOT NULL,
    "fullName" VARCHAR(160) NOT NULL,
    "segment" "CustomerSegment" NOT NULL DEFAULT 'MOSTRADOR',
    "priceListId" UUID,
    "email" VARCHAR(120),
    "phone" VARCHAR(40),
    "creditLimit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "creditUsed" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "creditTermDays" INTEGER NOT NULL DEFAULT 0,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
    "isBlockedForOverdue" BOOLEAN NOT NULL DEFAULT false,
    "authorizedPickups" JSONB,
    "deliveryAddresses" JSONB,
    "advanceBalance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "quoteNumber" VARCHAR(40) NOT NULL,
    "customerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "projectName" VARCHAR(150),
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(25) NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "itemsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(80) NOT NULL,
    "branchId" UUID NOT NULL,
    "terminalId" UUID NOT NULL,
    "cashShiftId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "cashierId" UUID NOT NULL,
    "prefix" VARCHAR(15) NOT NULL,
    "consecutive" BIGINT NOT NULL,
    "fullNumber" VARCHAR(40) NOT NULL,
    "isContingency" BOOLEAN NOT NULL DEFAULT false,
    "deliveryMode" "InvoiceDeliveryMode" NOT NULL DEFAULT 'RETIRO_INMEDIATO',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'EMITIDA_LOCAL',
    "subtotal" DECIMAL(18,4) NOT NULL,
    "discountTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,4) NOT NULL,
    "retentionTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(18,4) NOT NULL,
    "cufe" VARCHAR(120),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "uomCode" VARCHAR(15) NOT NULL,
    "factorToBase" DECIMAL(18,6) NOT NULL,
    "soldQty" DECIMAL(18,4) NOT NULL,
    "soldQtyInBase" DECIMAL(18,4) NOT NULL,
    "deliveredQtyInBase" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "custodyPendingInBase" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "discountAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(7,4) NOT NULL,
    "taxAmount" DECIMAL(18,4) NOT NULL,
    "unitCostSnapshot" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "bankName" VARCHAR(80),
    "referenceNumber" VARCHAR(80),
    "treasuryConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custody_delivery_vouchers" (
    "id" UUID NOT NULL,
    "voucherNumber" VARCHAR(40) NOT NULL,
    "invoiceId" UUID NOT NULL,
    "pickedUpByName" VARCHAR(140) NOT NULL,
    "pickedUpByDoc" VARCHAR(30) NOT NULL,
    "signatureUrl" VARCHAR(255),
    "dispatchedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custody_delivery_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custody_delivery_items" (
    "id" UUID NOT NULL,
    "voucherId" UUID NOT NULL,
    "invoiceItemId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "qtyInBase" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "custody_delivery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_orders" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(40) NOT NULL,
    "invoiceId" UUID NOT NULL,
    "deliveryAddress" VARCHAR(250) NOT NULL,
    "zone" VARCHAR(60),
    "totalWeightKg" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "totalVolumeM3" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "freightFee" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "vehiclePlate" VARCHAR(20),
    "driverName" VARCHAR(120),
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDIENTE_ALISTAMIENTO',
    "gatePassToken" VARCHAR(80) NOT NULL,
    "gatePassBurnedAt" TIMESTAMP(3),
    "gateCheckedBy" UUID,
    "proofPhotoUrl" VARCHAR(255),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatch_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL,
    "creditNoteNumber" VARCHAR(40) NOT NULL,
    "invoiceId" UUID NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "isCustodyCancelOnly" BOOLEAN NOT NULL DEFAULT false,
    "warehouseVerifiedBy" UUID,
    "approvedBy" UUID NOT NULL,
    "refundDestination" VARCHAR(30) NOT NULL,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_note_items" (
    "id" UUID NOT NULL,
    "creditNoteId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "returnedQty" DECIMAL(18,4) NOT NULL,
    "returnToDamaged" BOOLEAN NOT NULL DEFAULT false,
    "unitRefund" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "credit_note_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_shifts" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "terminalId" UUID NOT NULL,
    "cashierId" UUID NOT NULL,
    "status" "CashShiftStatus" NOT NULL DEFAULT 'ABIERTO',
    "openingFloat" DECIMAL(18,4) NOT NULL,
    "declaredCash" DECIMAL(18,4),
    "declaredCards" DECIMAL(18,4),
    "declaredTransfers" DECIMAL(18,4),
    "declaredChecks" DECIMAL(18,4),
    "expectedCash" DECIMAL(18,4),
    "expectedCards" DECIMAL(18,4),
    "expectedTransfers" DECIMAL(18,4),
    "expectedChecks" DECIMAL(18,4),
    "cashDifference" DECIMAL(18,4),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "cash_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_drops" (
    "id" UUID NOT NULL,
    "cashShiftId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "destination" VARCHAR(60) NOT NULL,
    "handedBy" UUID NOT NULL,
    "receivedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_drops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_count_denominations" (
    "id" UUID NOT NULL,
    "cashShiftId" UUID NOT NULL,
    "denomination" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "cash_count_denominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_receipts" (
    "id" UUID NOT NULL,
    "receiptNumber" VARCHAR(40) NOT NULL,
    "customerId" UUID NOT NULL,
    "cashShiftId" UUID,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "retentionAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "isAdvance" BOOLEAN NOT NULL DEFAULT false,
    "referenceNumber" VARCHAR(80),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "costType" VARCHAR(15) NOT NULL,
    "thirdPartyTaxId" VARCHAR(30) NOT NULL,
    "thirdPartyName" VARCHAR(140) NOT NULL,
    "supplierInvoiceNum" VARCHAR(60) NOT NULL,
    "sourceFund" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "taxAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "supportFileUrl" VARCHAR(255),
    "createdBy" UUID NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "originalAmount" DECIMAL(18,4) NOT NULL,
    "balanceAmount" DECIMAL(18,4) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "goodsReceiptId" UUID,
    "supplierInvoiceNum" VARCHAR(60) NOT NULL,
    "originalAmount" DECIMAL(18,4) NOT NULL,
    "balanceAmount" DECIMAL(18,4) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "earlyPayDeadline" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "branchId" UUID NOT NULL,
    "documentNumber" VARCHAR(30) NOT NULL,
    "fullName" VARCHAR(140) NOT NULL,
    "position" VARCHAR(80) NOT NULL,
    "contractType" VARCHAR(40) NOT NULL,
    "baseSalary" DECIMAL(18,4) NOT NULL,
    "commissionBasis" "CommissionBasis" NOT NULL DEFAULT 'VENTA_RECAUDADA',
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hiredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "workDate" DATE NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "overtimeHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "noveltyType" VARCHAR(30),

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_loans" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "totalAmount" DECIMAL(18,4) NOT NULL,
    "remainingAmount" DECIMAL(18,4) NOT NULL,
    "installmentValue" DECIMAL(18,4) NOT NULL,
    "reason" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'PRE_NOMINA',
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_slips" (
    "id" UUID NOT NULL,
    "payrollPeriodId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "baseEarned" DECIMAL(18,4) NOT NULL,
    "overtimeEarned" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "commissionsNet" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "legalDeductions" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "loanDeductions" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "payroll_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID,
    "supervisorId" UUID,
    "branchId" UUID,
    "terminalId" UUID,
    "ipAddress" VARCHAR(45),
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "entityName" VARCHAR(60) NOT NULL,
    "entityId" VARCHAR(80) NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" UUID NOT NULL,
    "ruleCode" VARCHAR(50) NOT NULL,
    "severity" "FraudSeverity" NOT NULL,
    "branchId" UUID,
    "userId" UUID,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "aggregateId" VARCHAR(80) NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "warehouses_branchId_type_idx" ON "warehouses"("branchId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_barcode_key" ON "warehouse_locations"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_warehouseId_zone_aisle_rack_level_key" ON "warehouse_locations"("warehouseId", "zone", "aisle", "rack", "level");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_isActive_idx" ON "users"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "supervisor_override_logs_requesterId_createdAt_idx" ON "supervisor_override_logs"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "supervisor_override_logs_approverId_createdAt_idx" ON "supervisor_override_logs"("approverId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rules_code_key" ON "tax_rules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_resolutions_branchId_prefix_documentType_key" ON "fiscal_resolutions"("branchId", "prefix", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_code_key" ON "pos_terminals"("code");

-- CreateIndex
CREATE INDEX "cash_drawer_events_terminalId_createdAt_idx" ON "cash_drawer_events"("terminalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_periods_year_month_key" ON "accounting_periods"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_code_key" ON "units_of_measure"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_categoryId_isActive_idx" ON "products"("categoryId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcodes_barcode_key" ON "product_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "product_barcodes_productId_idx" ON "product_barcodes"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_unit_conversions_productId_uomId_key" ON "product_unit_conversions"("productId", "uomId");

-- CreateIndex
CREATE UNIQUE INDEX "product_kit_items_kitProductId_componentId_key" ON "product_kit_items"("kitProductId", "componentId");

-- CreateIndex
CREATE INDEX "inventory_balances_warehouseId_salesBlocked_idx" ON "inventory_balances"("warehouseId", "salesBlocked");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balances_productId_warehouseId_key" ON "inventory_balances"("productId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "product_serials_serialNumber_key" ON "product_serials"("serialNumber");

-- CreateIndex
CREATE INDEX "product_serials_productId_status_idx" ON "product_serials"("productId", "status");

-- CreateIndex
CREATE INDEX "kardex_movements_productId_warehouseId_createdAt_idx" ON "kardex_movements"("productId", "warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "kardex_movements_documentType_documentId_idx" ON "kardex_movements"("documentType", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_taxId_key" ON "suppliers"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNumber_key" ON "purchase_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_receiptNumber_key" ON "goods_receipts"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_transferNumber_key" ON "stock_transfers"("transferNumber");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_counts_countNumber_key" ON "cycle_counts"("countNumber");

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_code_key" ON "price_lists"("code");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_items_priceListId_productId_minQuantity_key" ON "price_list_items"("priceListId", "productId", "minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "customers_taxId_key" ON "customers"("taxId");

-- CreateIndex
CREATE INDEX "customers_fullName_idx" ON "customers"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quoteNumber_key" ON "quotes"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_idempotencyKey_key" ON "invoices"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_fullNumber_key" ON "invoices"("fullNumber");

-- CreateIndex
CREATE INDEX "invoices_branchId_issuedAt_idx" ON "invoices"("branchId", "issuedAt");

-- CreateIndex
CREATE INDEX "invoices_customerId_issuedAt_idx" ON "invoices"("customerId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_payments_referenceNumber_key" ON "invoice_payments"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "custody_delivery_vouchers_voucherNumber_key" ON "custody_delivery_vouchers"("voucherNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_orders_orderNumber_key" ON "dispatch_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_orders_gatePassToken_key" ON "dispatch_orders"("gatePassToken");

-- CreateIndex
CREATE INDEX "dispatch_orders_status_zone_idx" ON "dispatch_orders"("status", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_creditNoteNumber_key" ON "credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "cash_shifts_terminalId_status_idx" ON "cash_shifts"("terminalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_receipts_receiptNumber_key" ON "customer_receipts"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customer_receipts_referenceNumber_key" ON "customer_receipts"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_thirdPartyTaxId_supplierInvoiceNum_key" ON "expenses"("thirdPartyTaxId", "supplierInvoiceNum");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_invoiceId_key" ON "accounts_receivable"("invoiceId");

-- CreateIndex
CREATE INDEX "accounts_receivable_customerId_status_dueDate_idx" ON "accounts_receivable"("customerId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "accounts_payable_dueDate_status_idx" ON "accounts_payable"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_payable_supplierId_supplierInvoiceNum_key" ON "accounts_payable"("supplierId", "supplierInvoiceNum");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_documentNumber_key" ON "employees"("documentNumber");

-- CreateIndex
CREATE INDEX "attendance_records_employeeId_workDate_idx" ON "attendance_records"("employeeId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_code_key" ON "payroll_periods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_slips_payrollPeriodId_employeeId_key" ON "payroll_slips"("payrollPeriodId", "employeeId");

-- CreateIndex
CREATE INDEX "audit_logs_module_createdAt_idx" ON "audit_logs"("module", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityName_entityId_idx" ON "audit_logs"("entityName", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_isResolved_severity_createdAt_idx" ON "fraud_alerts"("isResolved", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "outbox_events_processedAt_createdAt_idx" ON "outbox_events"("processedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_override_logs" ADD CONSTRAINT "supervisor_override_logs_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_override_logs" ADD CONSTRAINT "supervisor_override_logs_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_resolutions" ADD CONSTRAINT "fiscal_resolutions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_primaryResolutionId_fkey" FOREIGN KEY ("primaryResolutionId") REFERENCES "fiscal_resolutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_contingencyResolutionId_fkey" FOREIGN KEY ("contingencyResolutionId") REFERENCES "fiscal_resolutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_drawer_events" ADD CONSTRAINT "cash_drawer_events_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_baseUomId_fkey" FOREIGN KEY ("baseUomId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "tax_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_barcodes" ADD CONSTRAINT "product_barcodes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_barcodes" ADD CONSTRAINT "product_barcodes_unitConversionId_fkey" FOREIGN KEY ("unitConversionId") REFERENCES "product_unit_conversions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_unit_conversions" ADD CONSTRAINT "product_unit_conversions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_unit_conversions" ADD CONSTRAINT "product_unit_conversions_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_warehouse_locations" ADD CONSTRAINT "product_warehouse_locations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_warehouse_locations" ADD CONSTRAINT "product_warehouse_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "warehouse_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_kitProductId_fkey" FOREIGN KEY ("kitProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kardex_movements" ADD CONSTRAINT "kardex_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kardex_movements" ADD CONSTRAINT "kardex_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kardex_movements" ADD CONSTRAINT "kardex_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destWarehouseId_fkey" FOREIGN KEY ("destWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_cycleCountId_fkey" FOREIGN KEY ("cycleCountId") REFERENCES "cycle_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cashShiftId_fkey" FOREIGN KEY ("cashShiftId") REFERENCES "cash_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_delivery_vouchers" ADD CONSTRAINT "custody_delivery_vouchers_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_delivery_items" ADD CONSTRAINT "custody_delivery_items_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "custody_delivery_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_orders" ADD CONSTRAINT "dispatch_orders_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "credit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_drops" ADD CONSTRAINT "cash_drops_cashShiftId_fkey" FOREIGN KEY ("cashShiftId") REFERENCES "cash_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_count_denominations" ADD CONSTRAINT "cash_count_denominations_cashShiftId_fkey" FOREIGN KEY ("cashShiftId") REFERENCES "cash_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_receipts" ADD CONSTRAINT "customer_receipts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_slips" ADD CONSTRAINT "payroll_slips_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_slips" ADD CONSTRAINT "payroll_slips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
