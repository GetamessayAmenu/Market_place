const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

interface ServerGetOptions { revalidate?: number }

export async function serverGet<T = unknown>(path: string, options?: ServerGetOptions) {
  const url = `${API_BASE}${path}`
  const fetchOpts: RequestInit = { credentials: 'include' }
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
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error('POST ' + path + ' failed: ' + String(res.status))
  return (await res.json()) as T
}

export async function serverPatch<T = unknown>(path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error('PATCH ' + path + ' failed: ' + String(res.status))
  return (await res.json()) as T
}

export default { serverGet, serverPost, serverPatch }
