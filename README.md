# apex-capital-monorepo

**Apex Capital — controlled sandbox only**

# Apex Capital — Production Best Practices & Hardening Guide

This document defines production hardening standards, security configurations, and operational best practices for deploying the Apex Capital monorepo (`platform-api` and `platform-public`).

> **Scope:** Apply these controls only to authorized deployments. Validate all configuration changes in a non-production environment before rollout.

## 1. Backend Security (`platform-api`)

### CORS and Origin Validation

- **Strict origin matching:** Configure `ALLOWED_ORIGIN` with the exact Netlify production origin, such as `https://apex-capital.netlify.app` or your approved custom domain. Never use `*` in production.
- **Credentials support:** If the frontend sends cookies or `Authorization` headers, configure the Hono CORS middleware to allow credentials and only the required methods, including `GET`, `POST`, and `OPTIONS`.
- **Preflight handling:** Verify that production responses include the expected CORS headers for both preflight and application requests.

### Secrets Management

- **Never commit secrets:** Do not store JWT secrets, API keys, database credentials, or other sensitive values in Git, `.env` files, or `wrangler.jsonc`.
- **Use Wrangler secrets:** Provision sensitive production variables through Cloudflare Wrangler:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put API_SIGNING_KEY
```

- **Least privilege:** Use separate credentials and signing keys for development, staging, and production. Rotate them according to the incident-response and key-rotation policy.

### Database Safety (Cloudflare D1)

- **Migrations:** Run and verify migrations against the remote database before deploying Worker code that depends on schema changes:

```bash
npx wrangler d1 execute apex-capital-db --remote --file=./migrations/0001_init.sql
```

- **Backups:** Export or snapshot D1 data before major schema modifications and retain the export according to the recovery policy.
- **Migration discipline:** Use ordered, immutable migration files. Test migrations locally and confirm the remote database name and environment before execution.

## 2. Frontend Security and Optimization (`platform-public`)

### Environment Variable Hygiene

- **Public prefixing:** Expose only intentionally public variables prefixed with `VITE_` or `PUBLIC_` to the browser bundle.
- **No secrets in client code:** Never place private keys, JWT signing secrets, database credentials, or privileged tokens in frontend environment variables.
- **Runtime verification:** Confirm that the production build injects the live Worker URL through `VITE_API_URL`; production client requests must not target `localhost`.

### Netlify Hardening (`_headers` or `netlify.toml`)

Add security headers to the Netlify deployment. For example, in `netlify.toml`:

```toml
[[headers]]
for = "/*"

[headers.values]
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
Content-Security-Policy = "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
```

Review the Content Security Policy against the actual application dependencies. Remove `'unsafe-inline'` when the application can use nonces or hashes without breaking functionality.

## 3. Operational Monitoring and Health Probes

### Liveness (`/health`)

Provide a lightweight endpoint that confirms the Cloudflare Worker isolate is active. It should avoid database access and remain safe for frequent monitoring requests.

### Readiness (`/ready`)

Provide an active readiness probe that executes a lightweight database query such as `SELECT 1` against D1. Use this endpoint with uptime monitors or load balancers to detect database degradation without treating normal liveness as a database health check.

### Probe expectations

- Return a stable success status only when the relevant dependency is healthy.
- Return an appropriate failure status when readiness checks fail.
- Do not expose secrets, connection details, or stack traces in probe responses.
- Log failures with enough context for diagnosis while avoiding sensitive request data.

## Deployment Checklist

- [ ] `ALLOWED_ORIGIN` exactly matches the approved production origin.
- [ ] No production secrets are committed to the repository or frontend bundle.
- [ ] Wrangler secrets are provisioned and rotated through the approved process.
- [ ] D1 migrations are tested, backed up, and applied remotely before dependent code deployment.
- [ ] `VITE_API_URL` points to the production Worker endpoint.
- [ ] Netlify security headers are deployed and verified.
- [ ] `/health` does not query D1.
- [ ] `/ready` verifies D1 availability with a lightweight query.
- [ ] Monitoring alerts are configured for readiness failures and elevated error rates.
