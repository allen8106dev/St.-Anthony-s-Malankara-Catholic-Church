import axios, { AxiosError } from 'axios'

const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '')
const apiBaseUrl = configuredApiUrl.endsWith('/api/v1') ? configuredApiUrl : `${configuredApiUrl}/api/v1`

export const apiClient = axios.create({ baseURL: apiBaseUrl, withCredentials: true, headers: { 'Content-Type': 'application/json' } })
apiClient.interceptors.response.use((response) => response, (error: AxiosError<{ detail?: string }>) => { if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/login')) window.dispatchEvent(new Event('church:unauthenticated')); return Promise.reject(new Error(error.response?.data?.detail ?? 'Unable to complete the request.')) })
