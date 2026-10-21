import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  role: string
  roles?: string[] | undefined
  displayName: string
  avatarUrl: string | null
  emailVerified: boolean
  phoneVerified: boolean
  phone?: string | undefined
  bio?: string | null | undefined
  location?: string | null | undefined
  sellerType?: string | null | undefined
  socialLinks?: Record<string, any> | null | undefined
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (u: AuthUser) => void
  clear: () => void
  setLoading: (loading: boolean) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (u: AuthUser) => { set({ user: u, isLoading: false }) },
  clear: () => { set({ user: null, isLoading: false }) },
  setLoading: (loading: boolean) => { set({ isLoading: loading }) },
}))

export default useAuth
