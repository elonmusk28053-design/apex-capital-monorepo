import type { Config } from '@netlify/functions'
import { getDatabase } from '@netlify/database'

export default async () => {
  try {
    const db = getDatabase()
    await db.sql`SELECT 1`
    return Response.json({ status: 'ready', database: 'up' })
  } catch {
    return Response.json({ status: 'unavailable', database: 'down' }, { status: 503 })
  }
}

export const config: Config = {
  path: '/ready',
  method: 'GET',
}
