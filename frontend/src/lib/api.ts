import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Clear auth state and tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // Reset auth store
        if (typeof window !== 'undefined') {
          // Import dynamically to avoid circular dependency
          import('@/store/auth-store').then(({ useAuthStore }) => {
            useAuthStore.getState().logout()
          })
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// File upload API instance
export const uploadApi = axios.create({
  baseURL: API_BASE_URL,
})

// Add auth token to upload requests
uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh for uploads
uploadApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return uploadApi(originalRequest)
        }
      } catch (refreshError) {
        // Clear auth state and tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // Reset auth store
        if (typeof window !== 'undefined') {
          // Import dynamically to avoid circular dependency
          import('@/store/auth-store').then(({ useAuthStore }) => {
            useAuthStore.getState().logout()
          })
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

