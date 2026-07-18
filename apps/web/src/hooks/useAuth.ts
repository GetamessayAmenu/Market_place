import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  role: string
  roles?: string[]
  displayName: string
  avatarUrl: string | null
  emailVerified: boolean
  phoneVerified: boolean
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
