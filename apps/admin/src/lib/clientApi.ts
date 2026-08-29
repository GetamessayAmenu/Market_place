const API_BASE = '/api/v1'
let isAuthenticating = false

async function clientFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = API_BASE + path
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

  // If unauthorized and not already authenticating/calling auth, try auto-login as seeded admin
  if (res.status === 401 && !isAuthenticating && !path.includes('/auth/')) {
    isAuthenticating = true
    try {
      console.log('Session unauthenticated or expired, attempting admin auto-login...')
      const loginRes = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'admin@habesha.com', password: 'Test1234' }),
      })

      if (loginRes.ok) {
        const loginData = await loginRes.json()
        if (loginData.success && loginData.data?.tokens?.accessToken) {
          const newToken = loginData.data.tokens.accessToken
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_access_token', newToken)
          }
          headers['Authorization'] = `Bearer ${newToken}`
          console.log('Admin auto-login successful, retrying request:', url)
          res = await fetch(url, {
            credentials: 'include',
            ...options,
            headers,
          })
        }
      }
    } catch (err) {
      console.warn('Auto-login attempt failed:', err)
    } finally {
      isAuthenticating = false
    }
  }
  
  if (!res.ok) {
    const errorText = await res.text()
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token')
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
