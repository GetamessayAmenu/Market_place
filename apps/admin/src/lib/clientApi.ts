const API_BASE = '/api/v1'

async function clientFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = API_BASE + path
  console.log('Client API Request:', url, options?.method || 'GET')
  
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  
  console.log('Client API Response:', res.status, res.statusText)
  
  if (!res.ok) {
    const errorText = await res.text()
    console.error('Client API Error:', res.status, errorText)
    throw new Error('Request failed: ' + String(res.status))
  }
  
  const data = await res.json()
  console.log('Client API Data:', data)
  return data as T
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

export function clientDelete<T>(path: string): Promise<T> {
  return clientFetch<T>(path, {
    method: 'DELETE',
  })
}

// ─── Re-usable query builders ──────────────────────────────────────────────

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}
