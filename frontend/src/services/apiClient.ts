import axios, { AxiosError } from 'axios'

const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '')
export const apiBaseUrl = configuredApiUrl.endsWith('/api/v1') ? configuredApiUrl : `${configuredApiUrl}/api/v1`

export const apiClient = axios.create({ baseURL: apiBaseUrl, withCredentials: true, headers: { 'Content-Type': 'application/json' } })

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | Array<{ msg?: string; loc?: (string | number)[] }> }>) => {
    if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/login')) {
      window.dispatchEvent(new Event('church:unauthenticated'))
    }
    const d = error.response?.data?.detail
    let message = 'Unable to complete the request.'
    if (typeof d === 'string') {
      message = d
    } else if (Array.isArray(d)) {
      message = d.map(item => item.msg || JSON.stringify(item)).join(', ')
    } else if (d && typeof d === 'object') {
      message = JSON.stringify(d)
    } else if (error.message) {
      message = error.message
    }
    return Promise.reject(new Error(message))
  }
)
