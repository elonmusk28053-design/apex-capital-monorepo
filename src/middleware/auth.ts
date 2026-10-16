import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    tenantId: string;
    role: string;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env?.JWT_SECRET || (globalThis as any).process?.env?.JWT_SECRET || 'ci-test-secret-key-entropy-32-bytes-minimum!';

  try {
    const payload = await verify(token, jwtSecret, 'HS256');

    // Validate claims: sub, tenant_id, role, iss, aud
    if (!payload.sub || !payload.tenant_id || !payload.role) {
      return c.json({ error: 'Unauthorized: Missing required token claims' }, 401);
    }

    if (payload.iss !== 'https://auth.apexinvest.com' || payload.aud !== 'https://api.apexinvest.com') {
      return c.json({ error: 'Unauthorized: Invalid token issuer or audience' }, 401);
    }

    c.set('userId', payload.sub as string);
    c.set('tenantId', payload.tenant_id as string);
    c.set('role', payload.role as string);

    await next();
  } catch {
    return c.json({ error: 'Unauthorized: Cryptographic token verification failed' }, 401);
  }
}
