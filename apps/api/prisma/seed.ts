import { config as loadEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RoleCode, WarehouseType } from '@prisma/client';
import * as argon2 from 'argon2';

loadEnv();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const RESOURCES_MATRIX: Array<{
  resource: string;
  description: string;
  grants: Partial<
    Record<
      RoleCode,
      { actions: string[]; ownRecordsOnly?: boolean; maskedSensitive?: boolean }
    >
  >;
}> = [
  {
    resource: 'security.params',
    description: '1. Seguridad, Roles y Parámetros',
    grants: {
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A'] },
    },
  },
  {
    resource: 'fiscal.sequences',
    description: '1.1 Consecutivos y Reglas Fiscales',
    grants: {
      CONTADOR_TESORERIA: { actions: ['L', 'E'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A'] },
    },
  },
  {
    resource: 'inventory.catalog',
    description: '2. Catálogo de Productos (Sin costos)',
    grants: {
      CAJERO: { actions: ['L'], maskedSensitive: true },
      VENDEDOR_MOSTRADOR: { actions: ['L'], maskedSensitive: true },
      BODEGUERO: { actions: ['L', 'E'], maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['L'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E'] },
    },
  },
  {
    resource: 'inventory.costs',
    description: '2.1 Costos, Márgenes y Precios',
    grants: {
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A'] },
    },
  },
  {
    resource: 'purchases.orders',
    description: '2.2 Órdenes de Compra (OC)',
    grants: {
      BODEGUERO: { actions: ['L'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A', 'N'] },
    },
  },
  {
    resource: 'inventory.receipts',
    description: '2.3 Recepción de Mercancía',
    grants: {
      BODEGUERO: { actions: ['L', 'C'], maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['L'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'A', 'N'] },
    },
  },
  {
    resource: 'inventory.transfers_counts',
    description: '2.4 Traslados y Toma Física',
    grants: {
      BODEGUERO: { actions: ['L', 'C'], maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['L', 'C'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A'] },
    },
  },
  {
    resource: 'inventory.adjustments',
    description: '2.5 Ajustes de Inventario',
    grants: {
      BODEGUERO: { actions: ['C'], ownRecordsOnly: true, maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'A', 'N'] },
    },
  },
  {
    resource: 'sales.quotes',
    description: '3. Cotizaciones y Preventa',
    grants: {
      CAJERO: { actions: ['L'], maskedSensitive: true },
      VENDEDOR_MOSTRADOR: { actions: ['L', 'C', 'E'], ownRecordsOnly: true, maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A', 'N'] },
    },
  },
  {
    resource: 'pos.invoicing',
    description: '3.1 Facturación POS / Electrónica',
    grants: {
      CAJERO: { actions: ['L', 'C'], ownRecordsOnly: true, maskedSensitive: true },
      VENDEDOR_MOSTRADOR: { actions: ['L'], ownRecordsOnly: true, maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['L'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'A', 'N'] },
    },
  },
  {
    resource: 'logistics.dispatch',
    description: '3.2 Despachos, Rutas y Entregas',
    grants: {
      CAJERO: { actions: ['L'], maskedSensitive: true },
      VENDEDOR_MOSTRADOR: { actions: ['L'], maskedSensitive: true },
      BODEGUERO: { actions: ['L', 'E'], maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['L', 'C', 'E'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A', 'N'] },
    },
  },
  {
    resource: 'sales.returns',
    description: '3.3 Devoluciones y Notas Crédito',
    grants: {
      CAJERO: { actions: ['C'], maskedSensitive: true },
      VENDEDOR_MOSTRADOR: { actions: ['C'], maskedSensitive: true },
      BODEGUERO: { actions: ['A'], maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['L'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L', 'A'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'A', 'N'] },
    },
  },
  {
    resource: 'treasury.cash_shifts',
    description: '4. Apertura, Cobro y Arqueo Ciego',
    grants: {
      CAJERO: { actions: ['L', 'C'], ownRecordsOnly: true, maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L', 'A'] },
      ADMIN_GERENCIA: { actions: ['L', 'A', 'N'] },
    },
  },
  {
    resource: 'treasury.cash_drops',
    description: '4.1 Retiros / Sangrías de Efectivo',
    grants: {
      CAJERO: { actions: ['C'], ownRecordsOnly: true, maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L', 'A'] },
      ADMIN_GERENCIA: { actions: ['L', 'A'] },
    },
  },
  {
    resource: 'accounting.ar_ap_expenses',
    description: '5. Gastos, CxC (Cartera) y CxP',
    grants: {
      CAJERO: { actions: ['C'], maskedSensitive: true },
      VENDEDOR_MOSTRADOR: { actions: ['L'], maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['C'], maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L', 'C', 'E', 'A'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A', 'N'] },
    },
  },
  {
    resource: 'payroll.management',
    description: '6. Nómina, Asistencia y Comisiones',
    grants: {
      CAJERO: { actions: ['L'], ownRecordsOnly: true },
      VENDEDOR_MOSTRADOR: { actions: ['L'], ownRecordsOnly: true },
      BODEGUERO: { actions: ['L'], ownRecordsOnly: true },
      DESPACHADOR_LOGISTICA: { actions: ['L'], ownRecordsOnly: true },
      CONTADOR_TESORERIA: { actions: ['L', 'C', 'E'] },
      ADMIN_GERENCIA: { actions: ['L', 'C', 'E', 'A'] },
    },
  },
  {
    resource: 'bi.audit',
    description: '7. BI, Rentabilidad y Auditoría',
    grants: {
      VENDEDOR_MOSTRADOR: { actions: ['L'], ownRecordsOnly: true, maskedSensitive: true },
      DESPACHADOR_LOGISTICA: { actions: ['L'], ownRecordsOnly: true, maskedSensitive: true },
      CONTADOR_TESORERIA: { actions: ['L'] },
      ADMIN_GERENCIA: { actions: ['L', 'A'] },
    },
  },
];

async function main(): Promise<void> {
  console.log('Iniciando seed de NoheMI ERP...');

  // 1. Roles base
  const rolesConfig: Array<{
    code: RoleCode;
    name: string;
    canViewCosts: boolean;
    canViewCashExpected: boolean;
    canApproveOverride: boolean;
  }> = [
    {
      code: RoleCode.ADMIN_GERENCIA,
      name: 'Administrador / Gerencia',
      canViewCosts: true,
      canViewCashExpected: true,
      canApproveOverride: true,
    },
    {
      code: RoleCode.CONTADOR_TESORERIA,
      name: 'Contador / Tesorería',
      canViewCosts: true,
      canViewCashExpected: true,
      canApproveOverride: true,
    },
    {
      code: RoleCode.CAJERO,
      name: 'Cajero POS',
      canViewCosts: false,
      canViewCashExpected: false,
      canApproveOverride: false,
    },
    {
      code: RoleCode.VENDEDOR_MOSTRADOR,
      name: 'Vendedor Mostrador',
      canViewCosts: false,
      canViewCashExpected: false,
      canApproveOverride: false,
    },
    {
      code: RoleCode.BODEGUERO,
      name: 'Bodeguero',
      canViewCosts: false,
      canViewCashExpected: false,
      canApproveOverride: false,
    },
    {
      code: RoleCode.DESPACHADOR_LOGISTICA,
      name: 'Despachador / Logística',
      canViewCosts: false,
      canViewCashExpected: false,
      canApproveOverride: false,
    },
  ];

  const roleMap = new Map<RoleCode, string>();
  for (const rc of rolesConfig) {
    const role = await prisma.role.upsert({
      where: { code: rc.code },
      update: rc,
      create: rc,
    });
    roleMap.set(rc.code, role.id);
  }

  // 2. Permisos y relaciones RolePermission
  for (const entry of RESOURCES_MATRIX) {
    for (const [roleCodeKey, grant] of Object.entries(entry.grants)) {
      const roleCode = roleCodeKey as RoleCode;
      const roleId = roleMap.get(roleCode);
      if (!roleId || !grant) continue;

      for (const action of grant.actions) {
        const perm = await prisma.permission.upsert({
          where: { resource_action: { resource: entry.resource, action } },
          update: { description: `${entry.description} [${action}]` },
          create: {
            resource: entry.resource,
            action,
            description: `${entry.description} [${action}]`,
          },
        });

        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: perm.id } },
          update: {
            ownRecordsOnly: grant.ownRecordsOnly ?? false,
            maskedSensitive: grant.maskedSensitive ?? false,
          },
          create: {
            roleId,
            permissionId: perm.id,
            ownRecordsOnly: grant.ownRecordsOnly ?? false,
            maskedSensitive: grant.maskedSensitive ?? false,
          },
        });
      }
    }
  }

  // 3. Reglas tributarias DIAN Colombia (RF-03)
  const taxRules = [
    { code: 'IVA_19', name: 'IVA General 19%', taxType: 'IVA', ratePercent: 19, isRetention: false },
    { code: 'IVA_5', name: 'IVA Reducido 5%', taxType: 'IVA', ratePercent: 5, isRetention: false },
    { code: 'IVA_0', name: 'Exento / Excluido 0%', taxType: 'IVA', ratePercent: 0, isRetention: false },
    { code: 'RETEFUENTE_2_5', name: 'Retefuente Compras Declarantes 2.5%', taxType: 'RETEFUENTE', ratePercent: 2.5, isRetention: true },
    { code: 'RETEICA_0_7', name: 'ReteICA Comercial 7x1000', taxType: 'RETEICA', ratePercent: 0.7, isRetention: true },
  ];

  for (const tr of taxRules) {
    await prisma.taxRule.upsert({
      where: { code: tr.code },
      update: tr,
      create: tr,
    });
  }

  // 4. Unidades de Medida Ferreteras (RF-06)
  const uoms = [
    { code: 'UND', name: 'Unidad', allowDecimals: false },
    { code: 'M', name: 'Metro', allowDecimals: true },
    { code: 'CM', name: 'Centímetro', allowDecimals: true },
    { code: 'G', name: 'Gramo', allowDecimals: true },
    { code: 'KG', name: 'Kilogramo', allowDecimals: true },
    { code: 'ML', name: 'Mililitro', allowDecimals: true },
    { code: 'L', name: 'Litro', allowDecimals: true },
    { code: 'GAL', name: 'Galón', allowDecimals: true },
    { code: 'BTO', name: 'Bulto', allowDecimals: false },
    { code: 'RLL', name: 'Rollo', allowDecimals: false },
    { code: 'CJA', name: 'Caja Master', allowDecimals: false },
    { code: 'TON', name: 'Tonelada', allowDecimals: true },
    { code: 'M3', name: 'Metro Cúbico', allowDecimals: true },
  ];

  for (const u of uoms) {
    await prisma.unitOfMeasure.upsert({
      where: { code: u.code },
      update: u,
      create: u,
    });
  }

  // 5. Sede Principal y Bodegas base (RF-02)
  const mainBranch = await prisma.branch.upsert({
    where: { code: 'SEDE-01' },
    update: {},
    create: {
      code: 'SEDE-01',
      name: 'Sede Principal NoheMI',
      address: 'Zona Industrial Km 1',
      city: 'Montería',
      phone: '6047000000',
    },
  });

  const warehouses = [
    { code: 'BOD-MOST-01', name: 'Mostrador Principal', type: WarehouseType.MOSTRADOR, allowsDirectSales: true, allowsDispatch: true, allowsReceiving: false },
    { code: 'BOD-ALM-01', name: 'Almacén Cerrado', type: WarehouseType.ALMACEN_CERRADO, allowsDirectSales: true, allowsDispatch: true, allowsReceiving: true },
    { code: 'BOD-PAT-01', name: 'Patio de Graneles y Construcción', type: WarehouseType.PATIO_GRANELES, allowsDirectSales: true, allowsDispatch: true, allowsReceiving: true },
    { code: 'BOD-CUA-01', name: 'Bodega Cuarentena / Averías', type: WarehouseType.CUARENTENA_AVERIAS, allowsDirectSales: false, allowsDispatch: false, allowsReceiving: false },
  ];

  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {},
      create: { ...wh, branchId: mainBranch.id },
    });
  }

  // 6. Usuarios semilla (Admin con PIN 987654 y Cajero restringido)
  const adminPass = await argon2.hash('NohemiAdmin2026*', { type: argon2.argon2id });
  const adminPin = await argon2.hash('987654', { type: argon2.argon2id });
  const cashierPass = await argon2.hash('Cajero2026*', { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      branchId: mainBranch.id,
      roleId: roleMap.get(RoleCode.ADMIN_GERENCIA)!,
      username: 'admin',
      email: 'admin@nohemi.local',
      fullName: 'Gerente General NoheMI',
      passwordHash: adminPass,
      supervisorPinHash: adminPin,
    },
  });

  await prisma.user.upsert({
    where: { username: 'cajero1' },
    update: {},
    create: {
      branchId: mainBranch.id,
      roleId: roleMap.get(RoleCode.CAJERO)!,
      username: 'cajero1',
      email: 'cajero1@nohemi.local',
      fullName: 'Cajero Turno Mañana',
      passwordHash: cashierPass,
      allowedWorkStart: '06:00',
      allowedWorkEnd: '22:00',
    },
  });

  console.log('Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });