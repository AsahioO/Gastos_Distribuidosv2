import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const { refreshToken, logout, setAuth } = useAuthStore.getState()

      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/token/refresh/', {
            refresh: refreshToken,
          })

          const { access } = response.data
          const { user } = useAuthStore.getState()
          
          if (user) {
            setAuth(user, access, refreshToken)
          }

          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
