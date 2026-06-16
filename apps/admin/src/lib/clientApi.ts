const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

async function clientFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error('Request failed: ' + String(res.status))
  return (await res.json()) as T
}

export function clientGet<T>(path: string): Promise<T> {
  return clientFetch<T>(path)
}

export function clientPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  return clientFetch<T>(path, {
    method: 'POST',
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

export function clientPatch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  return clientFetch<T>(path, {
    method: 'PATCH',
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

// ─── Re-usable query builders ──────────────────────────────────────────────

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}
