'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { User } from '@resumate/types'
import api from '@/lib/api'
import { getToken, removeToken, setToken } from '@/lib/auth'
import axios from 'axios'

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput {
  email: string
  password: string
  name: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get<{ success: true; data: User }>('/api/auth/me')
      setUser(res.data.data)
    } catch {
      removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (getToken()) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.post<{ success: true; data: { token: string; user: User } }>(
      '/api/auth/login',
      input
    )
    setToken(res.data.data.token)
    setUser(res.data.data.user)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<{ success: true; data: { token: string; user: User } }>(
      '/api/auth/register',
      input
    )
    setToken(res.data.data.token)
    setUser(res.data.data.user)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
    return error.response.data.error.message as string
  }
  return '오류가 발생했습니다. 다시 시도해주세요.'
}
