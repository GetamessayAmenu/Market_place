const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

interface ServerGetOptions {
  revalidate?: number
  params?: Record<string, string | number | boolean | undefined>
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

  const fetchOpts: RequestInit = { credentials: 'include' }
  if (options?.revalidate !== undefined) {
    // ISR via Next.js fetch option
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (fetchOpts as any).next = { revalidate: options.revalidate }
  } else {
    fetchOpts.cache = 'no-store'
  }

  const res = await fetch(url, fetchOpts)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${String(res.status)}`)
  return (await res.json()) as T
}

export default { serverGet }
