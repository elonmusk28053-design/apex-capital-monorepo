---
title: Apex Capital Portfolio API Reference
intro: Implemented request and response contracts for the authenticated portfolio v1 endpoints.
layout: page
---

## Overview

This reference documents the portfolio routes implemented by `src/routes/portfolioRoutes.ts` and mounted at `/api/v1/portfolio`. All routes require a valid Bearer JWT. The middleware checks the `sub`, `tenant_id`, and `role` claims and validates the configured issuer and audience.

Monetary valuation fields are returned as integer cents. The `summary` and `performance` endpoints include runtime timestamps generated with `new Date().toISOString()`; the allocations response does not include a timestamp. The implementation does not currently return a `RELEASE: NO-GO-STAGING` posture field.

## Authentication

Send the JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

## `GET /api/v1/portfolio/summary`

Returns the authenticated tenant's portfolio summary. If the tenant is not in the in-memory simulation store, the handler uses fallback values.

### Response contract

```typescript
export interface PortfolioSummaryResponse {
  currency: 'USD';
  as_of: string;
  total_portfolio_value_cents: number;
  cash_balance_cents: number;
  unrealized_gain_cents: number;
  gain_percentage_bps: number;
  kyc_status: 'VERIFIED';
  account_status: 'ACTIVE';
}
```

### Example response

```json
{
  "currency": "USD",
  "as_of": "2026-11-03T22:27:00.000Z",
  "total_portfolio_value_cents": 12458000,
  "cash_balance_cents": 1245800,
  "unrealized_gain_cents": 996640,
  "gain_percentage_bps": 800,
  "kyc_status": "VERIFIED",
  "account_status": "ACTIVE"
}
```

## `GET /api/v1/portfolio/allocations`

Returns the authenticated tenant's allocation records. An unknown tenant receives an empty `allocations` array.

### Response contract

```typescript
export interface Allocation {
  asset_id: string;
  symbol: string;
  asset_class: string;
  allocation_bps: number;
  value_cents: number;
}

export interface PortfolioAllocationsResponse {
  currency: 'USD';
  tenant_id?: string;
  allocations: Allocation[];
}
```

`tenant_id` is present for a tenant found in the in-memory store and omitted for the unknown-tenant fallback response.

### Example response

```json
{
  "currency": "USD",
  "tenant_id": "tenant_alpha",
  "allocations": [
    {
      "asset_id": "ast_tsla_eq",
      "symbol": "TSLA",
      "asset_class": "EQUITY",
      "allocation_bps": 4500,
      "value_cents": 5606100
    },
    {
      "asset_id": "ast_megapack_infra",
      "symbol": "MEGAPACK",
      "asset_class": "INFRASTRUCTURE",
      "allocation_bps": 3500,
      "value_cents": 4360300
    },
    {
      "asset_id": "ast_fleet_credit",
      "symbol": "ROBOTAXI_FLT",
      "asset_class": "CREDIT",
      "allocation_bps": 2000,
      "value_cents": 2491600
    }
  ]
}
```

## `GET /api/v1/portfolio/performance`

Returns historical data points and a benchmark comparison. The optional `period` query parameter accepts `1M`, `3M`, `6M`, `1Y`, or `ALL`; it defaults to `1Y`. An invalid value returns HTTP `400` with an error and validation details.

### Response contract

```typescript
export type PerformancePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface PerformanceDataPoint {
  timestamp: string;
  value_cents: number;
}

export interface PortfolioPerformanceResponse {
  period: PerformancePeriod;
  currency: 'USD';
  data_points: PerformanceDataPoint[];
  benchmark_compare: {
    symbol: 'SPX';
    relative_performance_bps: number;
  };
}
```

### Example response

```json
{
  "period": "1Y",
  "currency": "USD",
  "data_points": [
    { "timestamp": "2025-10-15T00:00:00Z", "value_cents": 11626000 },
    { "timestamp": "2026-01-15T00:00:00Z", "value_cents": 11980000 },
    { "timestamp": "2026-06-15T00:00:00Z", "value_cents": 12210000 },
    { "timestamp": "2026-11-03T22:27:00.000Z", "value_cents": 12458000 }
  ],
  "benchmark_compare": {
    "symbol": "SPX",
    "relative_performance_bps": 142
  }
}
```

## `POST /api/v1/portfolio/statements/export`

Validates a statement period and format, then returns a generated export response with HTTP `201`. Despite the route's export purpose, the current handler responds synchronously; it does not return a queued job state.

### Request contract

`statement_period` must match `YYYY-MM`; `format` must be `PDF` or `CSV`.

```typescript
export interface StatementExportRequest {
  statement_period: string; // YYYY-MM
  format: 'PDF' | 'CSV';
}
```

### Example request

```json
{
  "statement_period": "2026-09",
  "format": "PDF"
}
```

### Response contract

```typescript
export interface StatementExportResponse {
  export_id: string;
  status: 'GENERATED';
  audit_seq: number;
  statement_period: string;
  format: 'PDF' | 'CSV';
  download_url: string;
}
```

Invalid JSON or a payload that fails validation returns HTTP `400` with an error and validation details.

### Example response

```json
{
  "export_id": "stmt_1793744820000_1001",
  "status": "GENERATED",
  "audit_seq": 1001,
  "statement_period": "2026-09",
  "format": "PDF",
  "download_url": "https://storage.apexinvest.com/statements/tenant_alpha/usr_alpha/stmt_1793744820000_1001.pdf"
}
```
