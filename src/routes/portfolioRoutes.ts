import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

const portfolioRouter = new Hono<{ Bindings: { JWT_SECRET?: string; AUDIT_SECRET?: string } }>();

// Enforce authentication on all portfolio endpoints
portfolioRouter.use('/*', authMiddleware);

const PerformanceQuerySchema = z.object({
  period: z.enum(['1M', '3M', '6M', '1Y', 'ALL']).default('1Y')
});

const StatementExportSchema = z.object({
  statement_period: z.string().regex(/^\d{4}-\d{2}$/, 'statement_period must match YYYY-MM format'),
  format: z.enum(['PDF', 'CSV'])
});

// In-memory tenant store for simulation and isolated verification
const tenantValuations: Record<string, { totalValueCents: number; cashBalanceCents: number; allocations: any[] }> = {
  tenant_alpha: {
    totalValueCents: 12458000,
    cashBalanceCents: 1245800,
    allocations: [
      { asset_id: 'ast_tsla_eq', symbol: 'TSLA', asset_class: 'EQUITY', allocation_bps: 4500, value_cents: 5606100 },
      { asset_id: 'ast_megapack_infra', symbol: 'MEGAPACK', asset_class: 'INFRASTRUCTURE', allocation_bps: 3500, value_cents: 4360300 },
      { asset_id: 'ast_fleet_credit', symbol: 'ROBOTAXI_FLT', asset_class: 'CREDIT', allocation_bps: 2000, value_cents: 2491600 }
    ]
  },
  tenant_bravo: {
    totalValueCents: 8500000,
    cashBalanceCents: 850000,
    allocations: [
      { asset_id: 'ast_tsla_eq', symbol: 'TSLA', asset_class: 'EQUITY', allocation_bps: 7000, value_cents: 5950000 },
      { asset_id: 'ast_solar_ppa', symbol: 'SOLAR_COMM', asset_class: 'INFRASTRUCTURE', allocation_bps: 3000, value_cents: 2550000 }
    ]
  }
};

let globalAuditSeq = 1000;
let lastAuditHash = '0000000000000000000000000000000000000000000000000000000000000000';

// 1. Portfolio Summary Handler
portfolioRouter.get('/summary', async (c) => {
  const tenantId = c.get('tenantId');
  const tenantData = tenantValuations[tenantId] ?? {
    totalValueCents: 1000000,
    cashBalanceCents: 100000,
    allocations: []
  };

  return c.json({
    currency: 'USD',
    as_of: new Date().toISOString(),
    total_portfolio_value_cents: tenantData.totalValueCents,
    cash_balance_cents: tenantData.cashBalanceCents,
    unrealized_gain_cents: Math.round(tenantData.totalValueCents * 0.08),
    gain_percentage_bps: 800,
    kyc_status: 'VERIFIED',
    account_status: 'ACTIVE'
  }, 200);
});

// 2. Allocations Handler
portfolioRouter.get('/allocations', async (c) => {
  const tenantId = c.get('tenantId');
  const tenantData = tenantValuations[tenantId];

  if (!tenantData) {
    return c.json({ currency: 'USD', allocations: [] }, 200);
  }

  return c.json({
    currency: 'USD',
    tenant_id: tenantId,
    allocations: tenantData.allocations
  }, 200);
});

// 3. Historical Performance Handler
portfolioRouter.get('/performance', async (c) => {
  const rawQuery = c.req.query();
  const parsed = PerformanceQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return c.json({ error: 'Invalid period parameter', details: parsed.error.format() }, 400);
  }

  const { period } = parsed.data;

  return c.json({
    period,
    currency: 'USD',
    data_points: [
      { timestamp: '2025-10-15T00:00:00Z', value_cents: 11626000 },
      { timestamp: '2026-01-15T00:00:00Z', value_cents: 11980000 },
      { timestamp: '2026-06-15T00:00:00Z', value_cents: 12210000 },
      { timestamp: new Date().toISOString(), value_cents: 12458000 }
    ],
    benchmark_compare: {
      symbol: 'SPX',
      relative_performance_bps: 142
    }
  }, 200);
});

// 4. Statement Export Handler
portfolioRouter.post('/statements/export', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = StatementExportSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid statement export payload', details: parsed.error.format() }, 400);
  }

  const tenantId = c.get('tenantId');
  const userId = c.get('userId');

  // Increment atomic sequence
  globalAuditSeq += 1;
  const auditSeq = globalAuditSeq;
  const exportId = `stmt_${Date.now()}_${auditSeq}`;

  return c.json({
    export_id: exportId,
    status: 'GENERATED',
    audit_seq: auditSeq,
    statement_period: parsed.data.statement_period,
    format: parsed.data.format,
    download_url: `https://storage.apexinvest.com/statements/${tenantId}/${userId}/${exportId}.${parsed.data.format.toLowerCase()}`
  }, 201);
});

export default portfolioRouter;
