function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  const trimmed = envUrl.replace(/\/+$/, '')
  if (trimmed.endsWith('/api/v1')) return trimmed
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`
  return `${trimmed}/api/v1`
}

const API_BASE = getApiBase()

interface ServerGetOptions {
  revalidate?: number
  params?: Record<string, string | number | boolean | undefined>
  cookieHeader?: string
}

interface ServerPostOptions {
  cookieHeader?: string
}

export async function serverGet<T = unknown>(path: string, options?: ServerGetOptions) {
  let url = `${API_BASE}${path}`

  if (options?.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    })
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const fetchOpts: RequestInit = {}
  if (options?.cookieHeader) {
    fetchOpts.headers = {
      Cookie: options.cookieHeader,
    }
  }
  if (options?.revalidate !== undefined) {
    // ISR via Next.js fetch option
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (fetchOpts as any).next = { revalidate: options.revalidate }
  } else {
    fetchOpts.cache = 'no-store'
  }

  const res = await fetch(url, fetchOpts)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${String(res.status)}`)
  const body = (await res.json()) as { data: T }
  return body.data
}

export async function serverPost<T = unknown>(path: string, body: unknown, options?: ServerPostOptions) {
  const url = `${API_BASE}${path}`
  
  const fetchOpts: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
  
  if (options?.cookieHeader) {
    fetchOpts.headers = {
      ...fetchOpts.headers,
      Cookie: options.cookieHeader,
    }
  }
  
  const res = await fetch(url, fetchOpts)
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(errorBody.message || `Failed to POST ${path}: ${String(res.status)}`)
  }
  const responseBody = (await res.json()) as { data: T }
  return responseBody.data
}

export default { serverGet, serverPost }
