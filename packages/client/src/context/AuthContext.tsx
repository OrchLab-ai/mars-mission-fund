import { createContext, useContext, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@mmf/shared'
import { fetchCurrentUser } from '../api/auth'

interface AuthState {
  user: User | null
  token: string | null
}

type AuthAction = { type: 'LOGIN'; payload: { token: string; user: User } } | { type: 'LOGOUT' }

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload.user, token: action.payload.token }
    case 'LOGOUT':
      return { user: null, token: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, token: null })

  useEffect(() => {
    // DEMO STUB: JWT is stored in localStorage for simplicity.
    // Production would use Clerk's SDK with httpOnly cookie storage,
    // which prevents XSS access to the token.
    const token = localStorage.getItem('token')
    if (!token) return

    fetchCurrentUser()
      .then((user) => {
        dispatch({ type: 'LOGIN', payload: { token, user } })
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
  }, [])

  function login(token: string, user: User) {
    dispatch({ type: 'LOGIN', payload: { token, user } })
  }

  function logout() {
    dispatch({ type: 'LOGOUT' })
  }

  const value: AuthContextValue = {
    ...state,
    isAuthenticated: state.token !== null,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}
