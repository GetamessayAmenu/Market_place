import create from 'zustand'

type User = { id: string; name?: string; email?: string } | null

type AuthState = {
  user: User
  setUser: (u: User) => void
  clear: () => void
}

export const useAuth = create<AuthState>((set: any) => ({
  user: null,
  setUser: (u: User) => set({ user: u }),
  clear: () => set({ user: null }),
}))

export default useAuth
