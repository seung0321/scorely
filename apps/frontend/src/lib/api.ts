import axios, { AxiosRequestConfig } from 'axios'
import {
  getToken, setToken, removeToken,
  getRefreshToken, setRefreshToken, removeRefreshToken,
} from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      !axios.isAxiosError(error) ||
      !error.config ||
      error.response?.status !== 401 ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // refresh 엔드포인트 자체가 실패한 경우 로그아웃
    if (originalRequest.url?.includes('/api/auth/refresh')) {
      removeToken()
      removeRefreshToken()
      return Promise.reject(error)
    }

    // 이미 재시도한 요청이면 로그아웃
    if (originalRequest._retry) {
      removeToken()
      removeRefreshToken()
      return Promise.reject(error)
    }

    // 다른 요청이 이미 refresh 중이면 큐에 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            }
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      isRefreshing = false
      removeToken()
      removeRefreshToken()
      return Promise.reject(error)
    }

    try {
      const res = await axios.post<{
        success: true
        data: { accessToken: string; refreshToken: string }
      }>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        { refreshToken },
      )

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data
      setToken(newAccessToken)
      setRefreshToken(newRefreshToken)

      processQueue(null, newAccessToken)

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccessToken}`,
      }
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      removeToken()
      removeRefreshToken()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
