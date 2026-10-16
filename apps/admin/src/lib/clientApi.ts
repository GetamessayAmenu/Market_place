function getApiBase(): string {
  if (typeof window !== 'undefined') return '/api/v1'
  return (process.env.BACKEND_API_URL || 'http://localhost:3001') + '/api/v1'
}

async function clientFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = getApiBase() + path
  let token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }

  let res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorText = await res.text()
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token')
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'refresh_token=; path=/api/v1/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    console.error('Client API Error:', res.status, errorText)
    throw new Error(`API error ${res.status}: ${errorText || res.statusText}`)
  }
  
  const data = await res.json()
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

export function clientPut<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  return clientFetch<T>(path, {
    method: 'PUT',
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
