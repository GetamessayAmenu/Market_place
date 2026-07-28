const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

interface ServerGetOptions {
  revalidate?: number
  cookieHeader?: string
}

export async function serverGet<T = unknown>(path: string, options?: ServerGetOptions) {
  const url = `${API_BASE}${path}`
  const fetchOpts: RequestInit = { credentials: 'include' }
  
  // Always include cookies for server-side calls
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  
  if (cookieHeader) {
    fetchOpts.headers = { Cookie: cookieHeader }
  }
  
  if (options?.revalidate !== undefined) {
    // @ts-expect-error Next.js extends RequestInit with `next` property
    fetchOpts.next = { revalidate: options.revalidate }
  } else {
    fetchOpts.cache = 'no-store'
  }

  const res = await fetch(url, fetchOpts)
  if (!res.ok) throw new Error('Failed to fetch ' + path + ': ' + String(res.status))
  return (await res.json()) as T
}

export async function serverPost<T = unknown>(path: string, body?: Record<string, unknown>) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error('POST ' + path + ' failed: ' + String(res.status))
  return (await res.json()) as T
}

export async function serverPatch<T = unknown>(path: string, body?: Record<string, unknown>) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error('PATCH ' + path + ' failed: ' + String(res.status))
  return (await res.json()) as T
}

export async function serverPut<T = unknown>(path: string, body?: Record<string, unknown>) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    credentials: 'include',
    cache: 'no-store',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error('PUT ' + path + ' failed: ' + String(res.status))
  return (await res.json()) as T
}

export async function serverDelete<T = unknown>(path: string) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    cache: 'no-store',
    headers,
  })
  if (!res.ok) throw new Error('DELETE ' + path + ' failed: ' + String(res.status))
  return (await res.json()) as T
}

export default { serverGet, serverPost, serverPatch, serverPut, serverDelete }
