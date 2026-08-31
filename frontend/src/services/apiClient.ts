import axios, { AxiosError } from 'axios'

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1', headers: { 'Content-Type': 'application/json' } })
apiClient.interceptors.response.use((response) => response, (error: AxiosError<{ detail?: string }>) => Promise.reject(new Error(error.response?.data?.detail ?? 'Unable to complete the request.')))
