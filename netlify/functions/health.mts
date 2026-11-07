import type { Config } from '@netlify/functions'

export default async () => {
  return Response.json({ status: 'ok', uptime: process.uptime() })
}

export const config: Config = {
  path: '/health',
  method: 'GET',
}
