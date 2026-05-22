'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'

interface UserContextValue {
  currentUser: {
    id: string
    name: string
    email: string
    role: string
    meta: string
    avatar?: string
  } | null
  logout: () => void
}

const UserContext = createContext<UserContextValue>({
  currentUser: null,
  logout: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: session.user.role,
        meta: session.user.meta,
        avatar: session.user.avatar,
      }
    : null

  function logout() {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <UserContext.Provider value={{ currentUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
