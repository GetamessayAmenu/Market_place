const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

type ServerGetOptions = { revalidate?: number }

export async function serverGet<T = any>(path: string, options?: ServerGetOptions) {
  const url = `${API_BASE}${path}`
  const fetchOpts: RequestInit = { credentials: 'include' }
  if (options?.revalidate !== undefined) {
    // ISR via Next.js fetch option
    // @ts-ignore-next-line
    fetchOpts['next'] = { revalidate: options.revalidate }
  } else {
    fetchOpts.cache = 'no-store'
  }

  const res = await fetch(url, fetchOpts)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return (await res.json()) as T
}

export default { serverGet }
