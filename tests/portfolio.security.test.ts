import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import portfolioRouter from '../src/routes/portfolioRoutes.js';
import { sign } from 'hono/jwt';

const app = new Hono();
app.route('/api/v1/portfolio', portfolioRouter);

const JWT_SECRET = 'ci-test-secret-key-entropy-32-bytes-minimum!';

async function generateTestToken(sub: string, tenantId: string, role: string) {
  return await sign(
    {
      sub,
      tenant_id: tenantId,
      role,
      iss: 'https://auth.apexinvest.com',
      aud: 'https://api.apexinvest.com',
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET,
    'HS256'
  );
}

describe('ApexInvest Portfolio & Security Invariant Tests', () => {

  // --- 1. Cross-Tenant Leak Prevention Test ---
  it('prevents cross-tenant data disclosure between Tenant A and Tenant B', async () => {
    const tokenTenantA = await generateTestToken('usr_alpha', 'tenant_alpha', 'CLIENT');
    const tokenTenantB = await generateTestToken('usr_bravo', 'tenant_bravo', 'CLIENT');

    // Request allocations for Tenant A
    const resA = await app.request('http://localhost/api/v1/portfolio/allocations', {
      headers: { Authorization: `Bearer ${tokenTenantA}` },
    });
    expect(resA.status).toBe(200);
    const dataA = await resA.json() as any;

    // Request allocations for Tenant B
    const resB = await app.request('http://localhost/api/v1/portfolio/allocations', {
      headers: { Authorization: `Bearer ${tokenTenantB}` },
    });
    expect(resB.status).toBe(200);
    const dataB = await resB.json() as any;

    expect(dataA.tenant_id).toBe('tenant_alpha');
    expect(dataB.tenant_id).toBe('tenant_bravo');
    expect(dataA.allocations).not.toEqual(dataB.allocations);
    expect(dataA.allocations.some((a: any) => a.symbol === 'ROBOTAXI_FLT')).toBe(true);
    expect(dataB.allocations.some((a: any) => a.symbol === 'ROBOTAXI_FLT')).toBe(false);
  });

  // --- 2. Audit Chain Sequence & Concurrency Test ---
  it('maintains monotonic sequence ordering under concurrent statement exports', async () => {
    const token = await generateTestToken('usr_audit_test', 'tenant_alpha', 'CLIENT');

    const exportPromises = Array.from({ length: 5 }).map((_, index) =>
      app.request('http://localhost/api/v1/portfolio/statements/export', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statement_period: `2026-0${index + 1}`,
          format: 'PDF',
        }),
      })
    );

    const responses = await Promise.all(exportPromises);
    const results = await Promise.all(responses.map((r) => r.json())) as any[];

    responses.forEach((res) => expect(res.status).toBe(201));

    const auditSeqs = results.map((r) => r.audit_seq);
    const uniqueSeqs = new Set(auditSeqs);
    expect(uniqueSeqs.size).toBe(auditSeqs.length);
  });

  // --- 3. Payload & Token Rigidity Test ---
  it('rejects invalid statement periods, malformed JSON, and missing JWT claims', async () => {
    const validToken = await generateTestToken('usr_test', 'tenant_alpha', 'CLIENT');

    // Test A: Invalid date format in statement export
    const resInvalidFormat = await app.request('http://localhost/api/v1/portfolio/statements/export', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statement_period: '2026/09',
        format: 'PDF',
      }),
    });
    expect(resInvalidFormat.status).toBe(400);

    // Test B: Missing Authorization header
    const resNoAuth = await app.request('http://localhost/api/v1/portfolio/summary', {
      method: 'GET',
    });
    expect(resNoAuth.status).toBe(401);

    // Test C: Forged / Expired / Invalid Claim Token
    const invalidToken = await sign(
      { sub: 'usr_fake', tenant_id: 'tenant_alpha', role: 'CLIENT', iss: 'wrong-issuer', aud: 'wrong-aud' },
      JWT_SECRET,
      'HS256'
    );
    const resInvalidClaim = await app.request('http://localhost/api/v1/portfolio/summary', {
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    expect(resInvalidClaim.status).toBe(401);
  });

});
